import * as path from 'path';
import * as fs from 'fs/promises';
import { createServer as createHTTPSServer } from 'https';
import { Jimple } from '@homer0/jimple';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { appLoggerProvider } from '@homer0/simple-logger';
import { envUtilsProvider } from '@homer0/env-utils';
import { packageInfoProvider } from '@homer0/package-info';
import { pathUtilsProvider } from '@homer0/path-utils';
import { rootFileProvider } from '@homer0/root-file';
import { EventsHub } from '@homer0/events-hub';
import { simpleConfigProvider } from '@homer0/simple-config';
import compression from 'compression';
import bodyParser from 'body-parser';
import multer from 'multer';
import statuses from 'statuses';
import {
  createServer as createSpdyServer,
  type ServerOptions as SpdyServerOptions,
} from 'spdy';
import express from 'express';
import type {
  DeepPartial,
  Express,
  PathUtils,
  SimpleConfig,
  SimpleLogger,
  JimpexOptions,
  JimpexHTTPSCredentials,
  JimpexHTTP2Options,
  JimpexHTTPSOptions,
  JimpexStartCallback,
  JimpexServer,
  JimpexServerInstance,
  JimpexEventName,
  JimpexEventPayload,
  DeepReadonly,
} from '../types';
import type { Controller, ControllerProvider, ControllerLike } from './resources';

export class Jimpex extends Jimple {
  protected options: JimpexOptions;
  protected express: Express;
  protected configReady: boolean = false;
  protected server?: JimpexServer;
  protected instance?: JimpexServerInstance;
  protected mountQueue: Array<(server: Express) => void> = [];
  protected controlledRoutes: string[] = [];
  constructor(options: DeepPartial<JimpexOptions> = {}, configuration: unknown = {}) {
    super();

    this.options = deepAssignWithOverwrite(
      {
        version: '0.0.0',
        filesizeLimit: '15MB',
        boot: true,
        proxy: false,
        configuration: {
          default: configuration,
          name: 'app',
          path: 'config/',
          hasFolder: true,
          environmentVariable: 'CONFIG',
          loadFromEnvironment: true,
          defaultConfigFilename: '[app-name].config.js',
          filenameFormat: '[app-name].[configuration-name].config.js',
        },
        statics: {
          enabled: true,
          onHome: false,
          route: 'statics',
          folder: '',
        },
        express: {
          trustProxy: true,
          disableXPoweredBy: true,
          compression: true,
          bodyParser: true,
          multer: true,
        },
        defaultServices: {
          common: true,
          http: true,
          utils: true,
        },
      },
      options,
      this.initOptions(),
    );

    this.express = express();

    this.setupCoreServices();

    this.init();
    if (this.options.boot) {
      this.boot();
    }
  }

  boot(): void {}

  disableTLSValidation() {
    // eslint-disable-next-line no-process-env, dot-notation
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    this.getLogger().warn('TLS validation has been disabled');
  }

  async start(onStart?: JimpexStartCallback): Promise<JimpexServerInstance> {
    await this.setupConfiguration();
    const config = this.getConfig();
    const port = config.get<number | undefined>('port');
    if (!port) {
      throw new Error('Port is not defined');
    }
    this.emitEvent('beforeStart', undefined);
    this.server = await this.createServer();
    this.instance = this.server!.listen(port, () => {
      this.emitEvent('start', undefined);
      this.mountResources();
      this.getLogger().success(`Starting on port ${port}`);
      this.emitEvent('afterStart', undefined);
      if (onStart) {
        onStart(config);
      }
      this.emitEvent('afterStartCallback', undefined);
    });

    return this.instance!;
  }

  async listen(
    port?: number,
    onStart?: JimpexStartCallback,
  ): Promise<JimpexServerInstance> {
    if (port) {
      await this.setupConfiguration();
      const config = this.getConfig();
      config.set('port', port);
    }

    return this.start(onStart);
  }

  stop(): void {
    if (!this.instance) return;
    this.emitEvent('beforeStop', undefined);
    this.instance.close();
    this.instance = undefined;
    this.emitEvent('afterStop', undefined);
  }

  mount(route: string, controller: ControllerLike): void {
    const useController =
      typeof controller.register === 'function'
        ? (controller as ControllerProvider).register(this, route)
        : (controller as Controller);

    this.mountQueue.push((server) => {
      /**
       * @todo Reduce routes.
       */
      const router = useController.connect(this, route);
      server.use(route, router);
      this.emitEvent('routeAdded', { route });
      this.controlledRoutes.push(route);
    });
  }

  getConfig(): SimpleConfig;
  getConfig<T = unknown>(setting: string | string[], asArray?: boolean): T;
  getConfig<T = unknown>(
    setting?: string | string[],
    asArray: boolean = false,
  ): SimpleConfig | T {
    const config = this.get<SimpleConfig>('config');
    if (typeof setting === 'undefined') {
      return config;
    }

    return config.get<T>(setting, asArray);
  }

  getLogger(): SimpleLogger {
    return this.get<SimpleLogger>('logger');
  }

  getExpress(): Express {
    return this.express;
  }

  getInstance(): JimpexServerInstance | undefined {
    return this.instance;
  }

  getOptions(): DeepReadonly<JimpexOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  protected init(): void {}

  protected initOptions(): DeepPartial<JimpexOptions> {
    return {};
  }

  protected setupCoreServices(): void {
    this.register(
      appLoggerProvider({
        serviceName: 'logger',
      }),
    );
    this.register(envUtilsProvider);
    this.register(packageInfoProvider);
    this.register(pathUtilsProvider);
    this.register(rootFileProvider);
    this.set('events', () => new EventsHub());
    this.set('statuses', () => statuses);
  }

  protected setupExpress(): void {
    const { filesizeLimit, express: expressOptions } = this.options;
    if (expressOptions.trustProxy) {
      this.express.enable('trust proxy');
    }

    if (expressOptions.disableXPoweredBy) {
      this.express.disable('x-powered-by');
    }

    if (expressOptions.compression) {
      this.express.use(compression());
    }

    /**
     * @todo Implement statics.
     */

    if (expressOptions.bodyParser) {
      this.express.use(
        bodyParser.json({
          limit: filesizeLimit,
        }),
      );
      this.express.use(
        bodyParser.urlencoded({
          extended: true,
          limit: filesizeLimit,
        }),
      );
    }

    if (expressOptions.multer) {
      this.express.use(multer().any());
    }

    this.set(
      'router',
      this.factory(() => express.Router()),
    );
  }

  protected async setupConfiguration(): Promise<void> {
    if (this.configReady) return;
    this.configReady = true;
    const { configuration: options } = this.options;

    let configsPath = options.path.replace(/\/$/, '');
    if (options.hasFolder) {
      configsPath = `${configsPath}${path.sep}${options.name}${path.sep}`;
    }

    const filenameFormat = options.filenameFormat
      .replace(/\[app-name\]/gi, options.name)
      .replace(/\[configuration-name\]/gi, '[name]');
    const defaultConfigFilename = options.defaultConfigFilename.replace(
      /\[app-name\]/gi,
      options.name,
    );

    this.register(
      simpleConfigProvider({
        name: options.name,
        defaultConfig: options.default,
        defaultConfigFilename,
        envVarName: options.environmentVariable,
        path: configsPath,
        filenameFormat,
      }),
    );

    const config = this.getConfig();
    /**
     * @todo Make this optional, as the file may not exists.
     */
    await config.loadFromFile();
    if (options.loadFromEnvironment) {
      await config.loadFromEnv();
    }
  }

  protected mountResources(): void {
    this.mountQueue.forEach((mount) => mount(this.express));
    this.mountQueue.length = 0;
  }

  protected emitEvent<E extends JimpexEventName>(
    name: E,
    payload: JimpexEventPayload<E>,
  ): void {
    const events = this.get<EventsHub>('events');
    events.emit(name, payload);
  }

  protected async loadCredentials(
    credentialsInfo: JimpexHTTPSCredentials,
    onHome: boolean = true,
  ): Promise<JimpexHTTPSCredentials> {
    const location = onHome === false ? 'app' : 'home';
    const pathUtils = this.get<PathUtils>('pathUtils');
    const keys: Array<keyof JimpexHTTPSCredentials> = ['ca', 'cert', 'key'];
    const info = await Promise.all(
      keys.map(async (key) => {
        const filepath = credentialsInfo[key];
        if (!filepath) return undefined;
        const file = await fs.readFile(pathUtils.joinFrom(location, filepath), 'utf8');
        return {
          key,
          file,
        };
      }),
    );

    return info.reduce<JimpexHTTPSCredentials>((acc, item) => {
      if (item) {
        acc[item.key] = item.file;
      }

      return acc;
    }, {});
  }

  protected async createServer(): Promise<JimpexServer> {
    const [http2Config = {}, httpsConfig = {}] = this.getConfig<
      [JimpexHTTP2Options, JimpexHTTPSOptions]
    >(['http2', 'https'], true);

    if (!http2Config.enabled && !httpsConfig.enabled) {
      return this.express;
    }

    if (http2Config.enabled && !httpsConfig.enabled) {
      throw new Error('HTTP2 requires for HTTPS to be enabled');
    }

    if (!httpsConfig.credentials) {
      throw new Error('The `credentials` object on the HTTPS settings is missing');
    }

    const credentials = await this.loadCredentials(
      httpsConfig.credentials,
      httpsConfig.credentials.onHome,
    );

    if (!Object.keys(credentials).length) {
      throw new Error('No credentials were found for HTTPS');
    }

    if (http2Config.enabled) {
      const serverOptions: SpdyServerOptions = {
        ...credentials,
        spdy: http2Config.spdy,
      };

      return createSpdyServer(serverOptions, this.express);
    }

    return createHTTPSServer(credentials, this.express);
  }
}

export const jimpex = (...args: ConstructorParameters<typeof Jimpex>): Jimpex =>
  new Jimpex(...args);
