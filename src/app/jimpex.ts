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
  commonServicesProvider,
  httpServicesProvider,
  utilsServicesProvider,
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
  Config,
  Logger,
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
  Router,
} from '../types';
/**
 * Jimpex is a mix of Jimple, a Javascript port of Pimple dependency injection container,
 * and Express, one of the most popular web frameworks for Node.
 *
 * @group Jimpex
 * @todo Implement `helmet`.
 */
export class Jimpex extends Jimple {
  /**
   * The customization settings for the application.
   */
  protected _options: JimpexOptions;
  /**
   * The Express application Jimpex uses under the hood.
   */
  protected _express: Express;
  /**
   * Since the configuration service has an async initialization, the class uses this flag
   * internally to validate if the configuration has been initialized or not.
   */
  protected _configReady: boolean = false;
  /**
   * A reference to the actuall HTTP the application will use. This can vary depending on
   * whether HTTPS, or HTTP2 are enabled. If HTTPS is not enabled, it will be the same as
   * the `express` property; if HTTPS is enabled, it will be an `https` server; and if
   * HTTP2 is enabled, it will be an `spdy` server.
   */
  protected _server?: JimpexServer;
  /**
   * The instance of the server that is listening for requests.
   */
  protected _instance?: JimpexServerInstance;
  /**
   * A list of functions that implement controllers and middlewares. When the application
   * starts, the queue will be processed and those controllers and middlewares will be
   * added to the server instance. The reason they are not added directly like with a
   * regular Express implementation is that services on Jimple use lazy loading, and
   * adding middlewares and controllers as they come could cause errors if they depend on
   * services that are not yet registered.
   */
  protected _mountQueue: Array<(server: Express) => void> = [];
  /**
   * A list with all the top routes controlled by the application. Every time a controller
   * is mounted, its route will be added here.
   */
  protected _controlledRoutes: string[] = [];
  /**
   * @param options  Preferences to customize the application.
   * @param config   The default settings for the configuration service. It's a
   *                 shortcuit for `options.config.default`
   */
  constructor(options: DeepPartial<JimpexOptions> = {}, config: unknown = {}) {
    super();

    this._options = deepAssignWithOverwrite(
      {
        filesizeLimit: '15MB',
        boot: true,
        path: {
          appPath: '',
          useParentPath: true,
        },
        config: {
          default: options?.config?.default || config,
          name: 'app',
          path: 'config/',
          hasFolder: false,
          loadFromEnvironment: true,
          environmentVariable: 'CONFIG',
          defaultConfigFilename: '[app-name].config.js',
          filenameFormat: '[app-name].[config-name].config.js',
        },
        statics: {
          enabled: true,
          onHome: false,
          route: 'statics',
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
      this._initOptions(),
    );

    this._express = express();

    this._setupCoreServices();
    this._setupExpress();
    this._configurePath();

    this._init();
    if (this._options.boot) {
      this.boot();
    }
  }
  /**
   * This is where the app would register all its specific services, middlewares and controllers.
   */
  boot(): void {}
  /**
   * Disables the server TLS validation. Meant to be used for development purposes.
   */
  disableTLSValidation() {
    // eslint-disable-next-line no-process-env, dot-notation
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    this.logger.warn('TLS validation has been disabled');
  }
  /**
   * Starts the app server.
   *
   * @param onStart  A callback function to be called when the server actually starts.
   * @returns The server instance.
   */
  async start(onStart?: JimpexStartCallback): Promise<JimpexServerInstance> {
    await this._setupConfig();
    const config = this.getConfig();
    const port = config.get<number | undefined>('port');
    if (!port) {
      throw new Error('No port configured');
    }
    this._emitEvent('beforeStart', { app: this });
    this._server = await this._createServer();
    this._instance = this._server!.listen(port, () => {
      this._emitEvent('start', { app: this });
      this._mountResources();
      this.logger.success(`Starting on port ${port}`);
      this._emitEvent('afterStart', { app: this });
      if (onStart) {
        onStart(config);
      }
      this._emitEvent('afterStartCallback', { app: this });
    });

    return this._instance!;
  }
  /**
   * This is an alias of `start`. The idea is for it to be used on serverless platforms,
   * where you don't get to start your app, you just have export it.
   *
   * @param port     In case the configuration doesn't already have it,
   *                 this is the port where the application will use to run. If this
   *                 parameter is used, the method will overwrite the `port`
   *                 setting on the configuration service.
   * @param onStart  A callback function to be called when the server starts.
   * @returns The server instance.
   */
  async listen(
    port?: number,
    onStart?: JimpexStartCallback,
  ): Promise<JimpexServerInstance> {
    if (port) {
      await this._setupConfig();
      const config = this.getConfig();
      config.set('port', port);
    }

    return this.start(onStart);
  }
  /**
   * Stops the server instance.
   */
  stop(): void {
    if (!this._instance) return;
    this._emitEvent('beforeStop', { app: this });
    this._instance.close();
    this._instance = undefined;
    this._emitEvent('afterStop', { app: this });
  }
  /**
   * Mounts a route controller or a middleware into a server routes.
   *
   * @param route       The route for the controller/middleware.
   * @param controller  The controller/middleware resource to be mounted.
   */
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

    this._mountQueue.push((server) => {
      const connected = useController.connect(this, route);
      if (!connected) return;
      const router = this._reduceWithEvent('controllerWillBeMounted', connected, {
        route,
        controller: useController,
        app: this,
      });
      server.use(route, router);
      this._emitEvent('routeAdded', { route, app: this });
      this._controlledRoutes.push(route);
    });
  }
  /**
   * Adds a global middleware to the application.
   *
   * @param middleware  The middleware resource to be added.
   */
  use(middleware: MiddlewareLike): void {
    const useMiddleware =
      'register' in middleware && typeof middleware.register === 'function'
        ? (middleware as MiddlewareProvider).register(this)
        : (middleware as Middleware | ExpressMiddlewareLike);
    this._mountQueue.push((server) => {
      if ('connect' in useMiddleware && typeof useMiddleware.connect === 'function') {
        const handler = useMiddleware.connect(this);
        if (handler) {
          server.use(
            this._reduceWithEvent('middlewareWillBeUsed', handler, { app: this }),
          );
        }

        return;
      }

      server.use(
        this._reduceWithEvent(
          'middlewareWillBeUsed',
          useMiddleware as ExpressMiddlewareLike,
          { app: this },
        ),
      );
    });
  }

  getConfig(): Config;
  getConfig<T = unknown>(setting: string | string[], asArray?: boolean): T;
  /**
   * Gets a setting from the configuration, or the configuration itself.
   *
   * @param setting  The setting or settings to be retrieved. If is not specified, it
   *                 will return the entire configuration.
   * @param asArray  If `true` and `setting` is an array, it will return the values as
   *                 an array instead of an object.
   * @template T  The type of the setting to be retrieved.
   */
  getConfig<T = unknown>(
    setting?: string | string[],
    asArray: boolean = false,
  ): Config | T {
    const config = this.try<Config>('config');
    if (!config) {
      throw new Error('The config service is not available until the app starts');
    }
    if (typeof setting === 'undefined') {
      return config;
    }

    return config.get<T>(setting, asArray);
  }
  /**
   * Creates a new router instance.
   */
  getRouter(): Router {
    return this.get('router');
  }
  /**
   * The logger service.
   */
  get logger(): Logger {
    return this.get<Logger>('logger');
  }
  /**
   * The Express application Jimpex uses under the hood.
   */
  get express(): Express {
    return this._express;
  }
  /**
   * The server instance that gets created when the app is started.
   */
  get instance(): JimpexServerInstance | undefined {
    return this._instance;
  }
  /**
   * The application customization options.
   */
  get options(): DeepReadonly<JimpexOptions> {
    return deepAssignWithOverwrite({}, this._options);
  }
  /**
   * Gets the events service.
   */
  get eventsHub(): EventsHub {
    return this.get<EventsHub>('events');
  }
  /**
   * A list of the routes that have controllers mounted on them.
   */
  get routes(): string[] {
    return this._controlledRoutes.slice();
  }
  /**
   * Adds a listener for an application event.
   *
   * @param eventName  The name of the event to listen for.
   * @param listener   The listener function.
   * @returns A function to unsubscribe the listener.
   * @template EventName  The name of the event, to match the type of the listener
   *                      function.
   */
  on<EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ): () => boolean {
    return this.eventsHub.on(eventName, listener);
  }
  /**
   * Adds a listener for an application event that will only be execuded once: the first
   * time the event is triggered.
   *
   * @param eventName  The name of the event to listen for.
   * @param listener   The listener function.
   * @returns A function to unsubscribe the listener.
   * @template EventName  The name of the event, to match the type of the listener
   *                      function.
   */
  once<EventName extends JimpexEventNameLike>(
    eventName: EventName,
    listener: JimpexEventListener<EventName>,
  ): () => boolean {
    return this.eventsHub.once(eventName, listener);
  }
  /**
   * Based on the application options, it returns wheter the application is healthy or
   * not.
   */
  isHealthy(): ReturnType<JimpexHealthCheckFn> {
    return this._options.healthCheck(this);
  }
  /**
   * This method is like a "lifecycle method", it gets executed on the constructor right
   * before the "boot step". The idea is for the method to be a helper when the
   * application is defined by subclassing {@link Jimpex}: the application could register
   * all important services here and the routes on boot, then, if the implementation needs
   * to access or overwrite a something, it can send `boot: false`, access/register what
   * it needs, and then call `boot()`. That would be impossible for an application without
   * overwriting the constructor and the boot functionality.
   */
  protected _init(): void {}
  /**
   * It generates overwrites for the application options when it gets created. This method
   * is a helper for when the application is defined by subclassing {@link Jimpex}: It's
   * highly probable that if the application needs to change the default options, it would
   * want to do it right from the class, instead of having to do it on every
   * implementation. A way to do it would be overwriting the constructor and calling
   * `super` with the custom overwrites, but this method exists so that won't be
   * necessary: when creating the `options`, the constructor will merge the result of this
   * method on top of the default ones.
   */
  protected _initOptions(): DeepPartial<JimpexOptions> {
    return {};
  }
  /**
   * Registers the "core services" on the container: logger, events, utils, etc.
   */
  protected _setupCoreServices(): void {
    this.register(
      appLoggerProvider({
        serviceName: 'logger',
      }),
    );
    this.register(envUtilsProvider);
    this.register(packageInfoProvider);
    this.register(pathUtilsProvider);
    this.register(rootFileProvider);
    const { services: enabledServices } = this._options;
    if (enabledServices.common) this.register(commonServicesProvider);
    if (enabledServices.http) this.register(httpServicesProvider);
    if (enabledServices.utils) this.register(utilsServicesProvider);

    this.set('events', () => new EventsHub());
    this.set('statuses', () => statuses);
  }
  /**
   * Configures the Express application based on the class options.
   */
  protected _setupExpress(): void {
    const { statics, filesizeLimit, express: expressOptions } = this._options;
    if (expressOptions.trustProxy) {
      this._express.enable('trust proxy');
    }

    if (expressOptions.disableXPoweredBy) {
      this._express.disable('x-powered-by');
    }

    if (expressOptions.compression) {
      this._express.use(compression());
    }

    if (statics.enabled) {
      this._addStaticsFolder(statics.route, statics.folder, statics.onHome);
    }

    if (expressOptions.bodyParser) {
      this._express.use(
        bodyParser.json({
          limit: filesizeLimit,
        }),
      );
      this._express.use(
        bodyParser.urlencoded({
          extended: true,
          limit: filesizeLimit,
        }),
      );
    }

    if (expressOptions.multer) {
      this._express.use(multer().any());
    }

    this.set(
      'router',
      this.factory(() => express.Router()),
    );
  }
  /**
   * Adds a static folder to the application.
   *
   * @param route   The route to add the folder to.
   * @param folder  The path to the folder in the file system. If not defined, it will
   *                be use the same value as `route`. The path could be relative to the
   *                project root, or where the application executable is located,
   *                depending on the value of the `onHome` parameter.
   * @param onHome  If `true`, the path to the folder will be relative to the project
   *                root. If `false`, it will be relative to where the application
   *                executable is located.
   */
  protected _addStaticsFolder(
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
  /**
   * This helper method validates the `path` options in order to register the `app`
   * location in the `pathUtils` service. The `app` location should be the path to where
   * the application executable is located, but due to how ESM works, we can't infer it
   * from the `module` object, so we need either recieved as the `appPath` setting, or try
   * to get it from the parent module.
   *
   * @throws If the method should use the path from the parent module, but can't find
   *         it.
   */
  protected _configurePath(): void {
    const pathUtils = this.get<PathUtils>('pathUtils');
    const {
      path: { appPath, useParentPath },
    } = this._options;
    if (appPath) {
      pathUtils.addLocation('app', appPath);
      return;
    }
    let foundPath = false;
    if (useParentPath) {
      const stack = new Error().stack!;
      const stackList = stack.split('\n');
      stackList.shift();
      const parentFromStack = stackList.find((line) => !line.includes(__filename));
      if (parentFromStack) {
        const parentFile = parentFromStack.replace(/^.*?\s\(([^\s]+):\d+:\d+\)/, '$1');
        if (parentFile !== parentFromStack) {
          foundPath = true;
          pathUtils.addLocation('app', path.dirname(parentFile));
        }
      }
    }

    if (!foundPath) {
      throw new Error(
        'The app location cannot be determined. Please specify the appPath option.',
      );
    }
  }
  /**
   * Setups the configuration service. The new configuration service requires async calls
   * in order to load the configuration files (as it uses `import` instead of `require`),
   * so it can't be instantiated as the other services.
   * This method is called just before starting the application.
   */
  protected async _setupConfig(): Promise<void> {
    if (this._configReady) return;
    this._configReady = true;
    const { config: options } = this._options;

    let configsPath = options.path.replace(/\/$/, '');
    if (options.hasFolder) {
      configsPath = `${configsPath}${path.sep}${options.name}${path.sep}`;
    }

    const filenameFormat = options.filenameFormat
      .replace(/\[app-name\]/gi, options.name)
      .replace(/\[config-name\]/gi, '[name]');
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
  /**
   * Processes the resources from the mount queue (added with {@link Jimpex.mount} and
   * {@link Jimpex.use}), and adds them to the Express application.
   */
  protected _mountResources(): void {
    this._mountQueue.forEach((mount) => mount(this._express));
    this._mountQueue.length = 0;
  }
  /**
   * Emits an event using the `events` service.
   *
   * @param name     The name of the event to emit.
   * @param payload  The event payload.
   * @template EventName  The literal name of the event, to type the event payload.
   */
  protected _emitEvent<EventName extends JimpexEventName>(
    name: EventName,
    payload: JimpexEventPayload<EventName>,
  ): void {
    this.eventsHub.emit(name, payload);
  }
  /**
   * Sends a target object to a list of reducer events so they can modify or replace it.
   *
   * @param name     The name of the event to use.
   * @param target   The object to reduce with the event.
   * @param payload  Extra context for the listeners.
   */
  protected _reduceWithEvent<EventName extends JimpexReducerEventName>(
    name: EventName,
    target: JimpexReducerEventTarget<EventName>,
    payload: JimpexReducerEventPayload<EventName>,
  ): JimpexReducerEventTarget<EventName> {
    return this.eventsHub.reduceSync(name, target, payload);
  }
  /**
   * Loads the contents of a dictionary of credentials files that need to be used to
   * configure HTTPS.
   *
   * @param credentialsInfo  The dictionary where the keys are the type of credentials
   *                         (`ca`, `cert`, `key`) and the values are the paths to the
   *                         files.
   * @param onHome           If this is `true`, the path of the files will be relative
   *                         to the project root. If it is `false`, it will be relative
   *                         to where the application executable is located.
   * @returns
   */
  protected async _loadCredentials(
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
  /**
   * Validates the configuration and chooses the server the application needs to use: If
   * HTTP2 is enabled, it will use Spdy; if HTTPS is enabled but HTTP is not, it will use
   * the native HTTPS server; otherwise, it will be just the Express instance.
   *
   * @returns {Server}
   * @throws {Error} If HTTP2 is enabled but HTTPS is not.
   * @throws {Error} If HTTPS is enabled but there's no `https.credentials` object.
   * @throws {Error} If HTTPS is enabled and no creadentials are found.
   * @access protected
   * @ignore
   */
  protected async _createServer(): Promise<JimpexServer> {
    const [http2Config = {}, httpsConfig = {}] = this.getConfig<
      [JimpexHTTP2Options, JimpexHTTPSOptions]
    >(['http2', 'https'], true);

    if (!http2Config.enabled && !httpsConfig.enabled) {
      return this._express;
    }

    if (http2Config.enabled && !httpsConfig.enabled) {
      throw new Error('HTTP2 requires for HTTPS to be enabled');
    }

    if (!httpsConfig.credentials) {
      throw new Error('The `credentials` object on the HTTPS settings is missing');
    }

    const credentials = await this._loadCredentials(
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

      return createSpdyServer(serverOptions, this._express);
    }

    return createHTTPSServer(credentials, this._express);
  }
}
/**
 * Shorthand for `new Jimpex()`.
 *
 * @param args  The same parameters as the {@link Jimpex} constructor.
 * @returns A new instance of {@link Jimpex}.
 * @group Jimpex
 */
export const jimpex = (...args: ConstructorParameters<typeof Jimpex>): Jimpex =>
  new Jimpex(...args);
