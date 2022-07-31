import * as path from 'path';
import fs from 'fs/promises';
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
import {
  createServer as createSpdyServer,
  type ServerOptions as SpdyServerOptions,
} from 'spdy';
import express from 'express';
import {
  common as commonServices,
  http as httpServices,
  utils as utilsServices,
} from '../services';
import {
  statuses,
  type Controller,
  type ControllerLike,
  type MiddlewareLike,
  type MiddlewareProvider,
  type Middleware,
} from '../utils';
import type {
  DeepPartial,
  Express,
  ExpressMiddlewareLike,
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
  JimpexReducerEventName,
  JimpexReducerEventPayload,
  JimpexReducerEventTarget,
  JimpexEventNameLike,
  JimpexEventListener,
  JimpexHealthCheckFn,
} from '../types';

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
        path: {
          appPath: '',
          useParentPath: true,
        },
        configuration: {
          default: options?.configuration?.default || configuration,
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
        services: {
          common: true,
          http: true,
          utils: true,
        },
        healthCheck: () => Promise.resolve(true),
      },
      options,
      this.initOptions(),
    );

    this.express = express();

    this.setupCoreServices();
    this.setupExpress();
    this.configurePath();

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
      throw new Error('No port configured');
    }
    this.emitEvent('beforeStart', { app: this });
    this.server = await this.createServer();
    this.instance = this.server!.listen(port, () => {
      this.emitEvent('start', { app: this });
      this.mountResources();
      this.getLogger().success(`Starting on port ${port}`);
      this.emitEvent('afterStart', { app: this });
      if (onStart) {
        onStart(config);
      }
      this.emitEvent('afterStartCallback', { app: this });
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
    this.emitEvent('beforeStop', { app: this });
    this.instance.close();
    this.instance = undefined;
    this.emitEvent('afterStop', { app: this });
  }

  mount(route: string, controller: ControllerLike): void {
    let useController: Controller | Middleware;
    if (
      'register' in controller &&
      typeof controller.register === 'function' &&
      controller.provider === true
    ) {
      useController = controller.register(this, route);
    } else if (
      'connect' in controller &&
      typeof controller.connect === 'function' &&
      (('middleware' in controller && controller.middleware === true) ||
        ('controller' in controller && controller.controller === true))
    ) {
      useController = controller;
    } else {
      useController = {
        middleware: true,
        connect: () => controller as ExpressMiddlewareLike,
      };
    }

    this.mountQueue.push((server) => {
      const connected = useController.connect(this, route);
      if (!connected) return;
      const router = this.reduceWithEvent('controllerWillBeMounted', connected, {
        route,
        controller: useController,
        app: this,
      });
      server.use(route, router);
      this.emitEvent('routeAdded', { route, app: this });
      this.controlledRoutes.push(route);
    });
  }

  use(middleware: MiddlewareLike): void {
    const useMiddleware =
      'register' in middleware && typeof middleware.register === 'function'
        ? (middleware as MiddlewareProvider).register(this)
        : (middleware as Middleware | ExpressMiddlewareLike);
    this.mountQueue.push((server) => {
      if ('connect' in useMiddleware && typeof useMiddleware.connect === 'function') {
        const handler = useMiddleware.connect(this);
        if (handler) {
          server.use(
            this.reduceWithEvent('middlewareWillBeUsed', handler, { app: this }),
          );
        }

        return;
      }

      server.use(
        this.reduceWithEvent(
          'middlewareWillBeUsed',
          useMiddleware as ExpressMiddlewareLike,
          { app: this },
        ),
      );
    });
  }

  getConfig(): SimpleConfig;
  getConfig<T = unknown>(setting: string | string[], asArray?: boolean): T;
  getConfig<T = unknown>(
    setting?: string | string[],
    asArray: boolean = false,
  ): SimpleConfig | T {
    const config = this.try<SimpleConfig>('config');
    if (!config) {
      throw new Error('The config service is not available until the app starts');
    }
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

  getEventsHub(): EventsHub {
    return this.get<EventsHub>('events');
  }

  getRoutes(): string[] {
    return this.controlledRoutes.slice();
  }

  on<EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ): () => boolean {
    return this.getEventsHub().on(eventName, listener);
  }

  once<EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ): () => boolean {
    return this.getEventsHub().once(eventName, listener);
  }

  isHealthy(): ReturnType<JimpexHealthCheckFn> {
    return this.options.healthCheck(this);
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
    const { services: enabledServices } = this.options;
    if (enabledServices.common) this.register(commonServices);
    if (enabledServices.http) this.register(httpServices);
    if (enabledServices.utils) this.register(utilsServices);

    this.set('events', () => new EventsHub());
    this.set('statuses', () => statuses);
  }

  protected setupExpress(): void {
    const { statics, filesizeLimit, express: expressOptions } = this.options;
    if (expressOptions.trustProxy) {
      this.express.enable('trust proxy');
    }

    if (expressOptions.disableXPoweredBy) {
      this.express.disable('x-powered-by');
    }

    if (expressOptions.compression) {
      this.express.use(compression());
    }

    if (statics.enabled) {
      this.addStaticsFolder(statics.route, statics.folder, statics.onHome);
    }

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

  protected addStaticsFolder(
    route: string,
    folder: string = '',
    onHome: boolean = false,
  ) {
    const location = onHome ? 'home' : 'app';
    const staticRoute = route.replace(/^\/+/, '');
    const pathUtils = this.get<PathUtils>('pathUtils');
    const staticFolder = pathUtils.joinFrom(location, folder || staticRoute);
    this.mount(`/${staticRoute}`, {
      connect: () => express.static(staticFolder),
      controller: true,
    });
  }

  protected configurePath(): void {
    const pathUtils = this.get<PathUtils>('pathUtils');
    const {
      path: { appPath, useParentPath },
    } = this.options;
    if (appPath) {
      pathUtils.addLocation('app', appPath);
      return;
    }
    let foundPath = false;
    if (useParentPath) {
      const stack = new Error().stack!;
      const parentFromStack = stack.split('\n')[2];
      if (parentFromStack) {
        const parentFile = parentFromStack.replace(/^.*?\s\(([^\s]+):\d+:\d+\)/, '$1');
        if (parentFile !== parentFromStack) {
          foundPath = true;
          pathUtils.addLocation('app', parentFile);
        }
      }
    }

    if (!foundPath) {
      throw new Error(
        'The app location cannot be determined. Please specify the appPath option.',
      );
    }
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
    await config.loadFromFile('', true, false);
    if (options.loadFromEnvironment) {
      await config.loadFromEnv();
    }
  }

  protected mountResources(): void {
    this.mountQueue.forEach((mount) => mount(this.express));
    this.mountQueue.length = 0;
  }

  protected emitEvent<EventName extends JimpexEventName>(
    name: EventName,
    payload: JimpexEventPayload<EventName>,
  ): void {
    this.getEventsHub().emit(name, payload);
  }

  protected reduceWithEvent<EventName extends JimpexReducerEventName>(
    name: EventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ): JimpexReducerEventTarget<EventName> {
    return this.getEventsHub().reduceSync(name, target, payload);
  }

  protected async loadCredentials(
    credentialsInfo: JimpexHTTPSCredentials,
    onHome: boolean = true,
  ): Promise<JimpexHTTPSCredentials> {
    const location = onHome ? 'home' : 'app';
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
