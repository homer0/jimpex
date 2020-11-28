const path = require('path');
const https = require('https');
const Jimple = require('jimple');
const ObjectUtils = require('wootils/shared/objectUtils');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs-extra');
const multer = require('multer');
const statuses = require('statuses');
const spdy = require('spdy');

/**
 * @typedef {import('../types').Express} Express
 * @typedef {import('../types').SpdyServer} SpdyServer
 * @typedef {import('../types').Server} Server
 * @typedef {import('../types').JimpexStartCallback} JimpexStartCallback
 * @typedef {import('../types').JimpexOptions} JimpexOptions
 */

/**
 * @module core
 */

const {
  appConfiguration,
  appLogger,
  environmentUtils,
  packageInfo,
  pathUtils,
  rootRequire,
} = require('wootils/node/providers');
const { EventsHub, proxyContainer } = require('wootils/shared');

const { eventNames } = require('../constants');
const commonServices = require('../services/common');
const httpServices = require('../services/http');
const utilsServices = require('../services/utils');
/**
 * Jimpex is a mix of Jimple, a Javascript port of Pimple dependency injection container,
 * and Express, one of the most popular web frameworks for Node.
 *
 * @augments Jimple
 * @parent module:core
 * @todo Implement `helmet`.
 */
class Jimpex extends Jimple {
  /**
   * @param {Partial<JimpexOptions>} [options={}]
   * Preferences to customize the application.
   * @param {?Object} [configuration=null]
   * The default configuration for the `appConfiguration` service.
   */
  constructor(options = {}, configuration = null) {
    super();
    /**
     * The application options.
     *
     * @type {JimpexOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge(
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
          loadVersionFromConfiguration: true,
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
      this._initOptions(),
    );
    /**
     * If the `proxy` option was set to `true`, this property will have a reference for a
     * proxy of the container, in which resources can be registered and obtained using dot
     * notation.
     *
     * @type {?Proxy<Jimpex>}
     * @access protected
     * @ignore
     */
    this._proxy = this._options.proxy ? proxyContainer(this) : null;
    /**
     * The Express application Jimpex uses under the hood.
     *
     * @type {Express}
     * @access protected
     * @ignore
     */
    this._express = express();
    /**
     * When Jimpex is used with HTTP2 enabled, this property will be used to store the
     * "patched"
     * version of Express that uses Spdy.
     *
     * @type {?SpdyServer}
     * @access protected
     * @ignore
     */
    this._spdy = null;
    /**
     * When the application starts, this will be the instance of the server.
     *
     * @type {?Server}
     * @access protected
     * @ignore
     */
    this._instance = null;
    /**
     * A list of functions that return controllers and middlewares. When the application
     * starts,
     * the queue will be processed and those controllers and middlewares will be added to
     * the server instance The reason they are not added directly like with a regular
     * Express implementation is that services on Jimple use lazy loading, and adding
     * middlewares and controllers as they come could cause errors if they depend on
     * services that are not yet registered.
     *
     * @type {Function[]}
     * @access protected
     * @ignore
     */
    this._mountQueue = [];
    /**
     * A list with all the top routes controlled by the application. Every time a
     * controller is mounted, its route will be added here.
     *
     * @type {string[]}
     * @access protected
     * @ignore
     */
    this._controlledRoutes = [];

    this._setupCoreServices();
    this._setupExpress();
    this._setupDefaultServices();
    this._setupConfiguration();

    this._init();
    if (this._options.boot) {
      this.boot();
    }
  }
  /**
   * This is where the app would register all its specific services, middlewares and controllers.
   */
  boot() {}
  /**
   * Disables the server TLS validation.
   */
  disableTLSValidation() {
    // eslint-disable-next-line no-process-env
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.get('appLogger').warning('TLS validation has been disabled');
  }
  /**
   * This is an alias of `start`. The idea is for it to be used on serverless platforms,
   * where you don't get to start your app, you just have export it.
   *
   * @param {?number}              [port=null]  In case the configuration doesn't already
   *                                            have it,
   *                                            this is the port where the application
   *                                            will use to run. If this parameter is
   *                                            used, the method will overwrite the `port`
   *                                            setting on the configuration service.
   * @param {?JimpexStartCallback} [fn=null]    A callback function to be called when the
   *                                            server starts.
   * @returns {Server} The server instance.
   */
  listen(port = null, fn = null) {
    if (port) {
      const config = this.get('appConfiguration');
      config.set('port', port);
    }

    return this.start(fn);
  }
  /**
   * Mounts a controller on a specific route.
   *
   * @param {string} route
   * The route for the controller.
   * @param {Controller | ControllerProvider} controller
   * The route controller.
   */
  mount(route, controller) {
    const ref = this.ref();
    const useController =
      typeof controller.register === 'function'
        ? controller.register(ref, route)
        : controller;
    this._mountQueue.push((server) => {
      let result;
      const routes = this._reduceWithEvent(
        'controllerWillBeMounted',
        useController.connect(ref, route),
        route,
        useController,
      );
      if (Array.isArray(routes)) {
        // If the returned value is a list of routes, mount each single route.
        result = routes.forEach((routeRouter) => server.use(route, routeRouter));
      } else {
        // But if the returned value is not a list, it may be a router, so mount it directly.
        result = server.use(route, routes);
      }

      this._controlledRoutes.push(route);
      this._emitEvent('routeAdded', route);
      return result;
    });
  }
  /**
   * Gets "safe" reference for the container that validates if the "proxy mode" is
   * enabled, in order to provide the proxy or the actual instance.
   *
   * @returns {Jimpex}
   */
  ref() {
    return this._proxy || this;
  }
  /**
   * Registers a provider to extend the application.
   *
   * @param {Provider} provider  The provider to register.
   */
  register(provider) {
    provider.register(this.ref());
  }
  /**
   * Starts the app server.
   *
   * @param {?JimpexStartCallback} [fn=null]  A callback function to be called when the
   *                                          server starts.
   * @returns {Object} The server instance.
   */
  start(fn = null) {
    const config = this.get('appConfiguration');
    const port = config.get('port');
    this._emitEvent('beforeStart');
    this._server = this._getServer();
    this._instance = this._server.listen(port, () => {
      this._emitEvent('start');
      this._mountResources();
      this.get('appLogger').success(`Starting on port ${port}`);
      this._emitEvent('afterStart');
      if (fn) {
        fn(config);
      }
      this._emitEvent('afterStartCallback');
    });

    return this._instance;
  }
  /**
   * Stops the server instance.
   */
  stop() {
    if (this._instance) {
      this._emitEvent('beforeStop');
      this._instance.close();
      this._instance = null;
      this._emitEvent('afterStop');
    }
  }
  /**
   * Tries to access a resource on the container, but if is not present, it won't throw an
   * error,
   * it will just return `null`.
   *
   * @param {string} name  The name of the resource.
   * @returns {*}
   * @throws {Error} If there's an error other than the one generated when the resource
   *                 doesn't exist.
   */
  try(name) {
    return this.has(name) ? this.get(name) : null;
  }
  /**
   * Adds a middleware.
   *
   * @param {MiddlewareLike} middleware  The middleware to use.
   */
  use(middleware) {
    const ref = this.ref();
    const useMiddleware =
      typeof middleware.register === 'function' ? middleware.register(ref) : middleware;
    this._mountQueue.push((server) => {
      if (typeof useMiddleware.connect === 'function') {
        // If the middleware is from Jimpex, connect it and then use it.
        const middlewareHandler = useMiddleware.connect(ref);
        if (middlewareHandler) {
          server.use(
            this._reduceWithEvent('middlewareWillBeUsed', middlewareHandler, middleware),
          );
        }
      } else {
        // But if the middleware is a regular middleware, just use it directly.
        server.use(this._reduceWithEvent('middlewareWillBeUsed', useMiddleware, null));
      }
    });
  }
  /**
   * The Express app Jimpex uses under the hood.
   *
   * @type {Express}
   */
  get express() {
    return this._express;
  }
  /**
   * The server instance that gets created when the app is started.
   *
   * @returns {?Server}
   */
  get instance() {
    return this._instance;
  }
  /**
   * The app options.
   *
   * @type {JimpexOptions}
   */
  get options() {
    return ObjectUtils.copy(this._options);
  }
  /**
   * A list of all the top routes controlled by the app.
   *
   * @type {string[]}
   */
  get routes() {
    return ObjectUtils.copy(this._controlledRoutes);
  }
  /**
   * Helper method to add static folders to the app.
   *
   * @param {string}  route           The route for the static folder.
   * @param {string}  [folder='']     The path to the folder. If not defined, it will use
   *                                  the value from `route`.
   * @param {boolean} [onHome=false]  If `true`, the path to the folder will be relative
   *                                  to where the app is being executed
   *                                  (`process.cwd()`), otherwise, it will be relative to
   *                                  where the executable file is located.
   * @access protected
   * @ignore
   */
  _addStaticsFolder(route, folder = '', onHome = false) {
    const joinFrom = onHome ? 'home' : 'app';
    const staticRoute = route.replace(/^\/+/, '');
    const staticFolder = this.get('pathUtils').joinFrom(joinFrom, folder || staticRoute);
    this._express.use(`/${staticRoute}`, express.static(staticFolder));
  }
  /**
   * Emits an app event with a reference to this class instance.
   *
   * @param {string} name  The name of the event on {@link JimpexEvents}.
   * @param {...*}   args  Extra parameters for the listeners.
   * @access protected
   * @ignore
   */
  _emitEvent(name, ...args) {
    this.get('events').emit(eventNames[name], ...[...args, this]);
  }
  /**
   * Validates the configuration and chooses the server the application needs to use: If
   * HTTP2 is enabled, it will use Spdy; if HTTP is enabled but HTTP is not, it will use
   * the native HTTPS server; otherwise, it will be just the Express instance.
   *
   * @returns {Server}
   * @throws {Error} If HTTP2 is enabled but HTTPS is not.
   * @throws {Error} If HTTPS is enabled but there's no `https.credentials` object.
   * @throws {Error} If HTTPS is enabled and no creadentials are found.
   * @access protected
   * @ignore
   */
  _getServer() {
    let [http2Config, httpsConfig] = this.get('appConfiguration').get(
      ['http2', 'https'],
      true,
    );

    // Just in case any of those settings are `null` - which overwrites destructuring.
    http2Config = http2Config || {};
    httpsConfig = httpsConfig || {};

    let result;
    if (!http2Config.enabled && !httpsConfig.enabled) {
      result = this._express;
    } else {
      if (http2Config.enabled && !httpsConfig.enabled) {
        throw new Error('HTTP2 requires for HTTPS to be enabled');
      } else if (!httpsConfig.credentials) {
        throw new Error('The `credentials` object on the HTTPS settings is missing');
      }

      const credentials = this._loadCredentials(
        httpsConfig.credentials.onHome,
        httpsConfig.credentials,
      );

      if (!Object.keys(credentials).length) {
        throw new Error('No credentials were found for HTTPS');
      }

      if (http2Config.enabled) {
        if (http2Config.spdy) {
          credentials.spdy = http2Config.spdy;
        }

        result = spdy.createServer(credentials, this._express);
      } else {
        result = https.createServer(credentials, this._express);
      }
    }

    return result;
  }
  /**
   * This method is like a "lifecycle method", it gets executed on the constructor right
   * before the "boot step". The idea is for the method to be a helper when application is
   * defined by subclassing {@link Jimpex}: the application could register all important
   * services here and the routes on boot, then, if the implementation needs to access or
   * overwrite a something, it can send `boot: false`, access/register what it needs and
   * then call `boot()`. That would be impossible for an application without overwriting
   * the constructor and the boot functionality.
   *
   * @access protected
   */
  _init() {}
  /**
   * It generates overwrites for the class options when they are created. This method is a
   * helper for when the application is defined by subclassing {@link Jimpex}: It's highly
   * probable that if the application needs to change the default options, it would want
   * to do it right from the class, instead of having to do it on every implementation. A
   * way to do it would be overwriting the constructor and calling `super` with the custom
   * overwrites; this method exists so that won't be necessary: when creating the
   * `options`, the constructor will merge the result of this method on top of the default
   * ones.
   *
   * @returns {Partial<JimpexOptions>}
   * @access protected
   */
  _initOptions() {
    return {};
  }
  /**
   * Loads the contents of a dictionary of files that need to be used for HTTPS
   * credentials.
   *
   * @param {boolean}                 onHome           If this is `true`, the path of the
   *                                                   files will be relative to the
   *                                                   project root directory;
   *                                                   otherwise, it will be relative to
   *                                                   the directory where the application
   *                                                   executable is located.
   * @param {Object.<string, string>} credentialsInfo  The dictionary where the keys are
   *                                                   the type of credentials (`ca`,
   *                                                   `cert` and/or `key`) and the values
   *                                                   the paths to the files.
   * @returns {Object.<string, string>}
   * @access protected
   * @ignore
   */
  _loadCredentials(onHome, credentialsInfo) {
    const location = onHome === false ? 'app' : 'home';
    const usePathUtils = this.get('pathUtils');
    return ['ca', 'cert', 'key']
      .filter((key) => typeof credentialsInfo[key] === 'string')
      .reduce(
        (acc, key) => ({
          ...acc,
          [key]: fs.readFileSync(usePathUtils.joinFrom(location, credentialsInfo[key])),
        }),
        {},
      );
  }
  /**
   * Processes and mount all the resources on the `mountQueue`.
   *
   * @access protected
   * @ignore
   */
  _mountResources() {
    this._mountQueue.forEach((mountFn) => mountFn(this._express));
    this._mountQueue.length = 0;
  }
  /**
   * Sends a target object to a list of reducer events so they can modify or replace it.
   * This method also sends a reference to this class instance as the last parameter of
   * the event.
   *
   * @param {string} name    The name of the event on {@link JimpexEvents}.
   * @param {*}      target  The targe object to reduce.
   * @param {...*}   args    Extra parameters for the listeners.
   * @returns {*} An object of the same type as the `target`.
   * @access protected
   * @ignore
   */
  _reduceWithEvent(name, target, ...args) {
    return this.get('events').reduce(eventNames[name], target, ...[...args, this]);
  }
  /**
   * Creates the configuration service.
   *
   * @access protected
   * @ignore
   */
  _setupConfiguration() {
    const { version, configuration: options } = this._options;
    const { name, environmentVariable, loadVersionFromConfiguration } = options;
    let configsPath = options.path;
    if (options.hasFolder) {
      configsPath += `${options.name}/`;
    }
    const filenameFormat = options.filenameFormat
      .replace(/\[app-name\]/gi, name)
      .replace(/\[configuration-name\]/gi, '[name]');

    let defaultConfig = {};
    if (options.default) {
      defaultConfig = options.default;
    } else {
      const defaultConfigPath = path.join(configsPath, `${options.name}.config.js`);
      defaultConfig = this.get('rootRequire')(defaultConfigPath);
    }

    if (!loadVersionFromConfiguration) {
      defaultConfig = { version, ...defaultConfig };
    }

    this.register(
      appConfiguration({
        appName: name,
        defaultConfiguration: defaultConfig,
        options: {
          environmentVariable,
          path: configsPath,
          filenameFormat,
        },
      }),
    );

    if (options.loadFromEnvironment) {
      this.get('appConfiguration').loadFromEnvironment();
    }

    if (loadVersionFromConfiguration) {
      this._options.version = this.get('appConfiguration').get('version');
    }
  }
  /**
   * Registers the _'core services'_.
   *
   * @access protected
   * @ignore
   */
  _setupCoreServices() {
    // The logger service.
    this.register(appLogger);
    // The service that reads the environment variables.
    this.register(environmentUtils);
    // The app `package.json` information.
    this.register(packageInfo);
    // The service to build paths relative to the project root directory.
    this.register(pathUtils);
    // The service to make `require`s relatives to the project root directory.
    this.register(rootRequire);
  }
  /**
   * Based on the constructor received options, register or not the default services.
   *
   * @access protected
   * @ignore
   */
  _setupDefaultServices() {
    const { defaultServices } = this._options;

    if (defaultServices.common) {
      this.register(commonServices);
    }

    if (defaultServices.http) {
      this.register(httpServices);
    }

    if (defaultServices.utils) {
      this.register(utilsServices);
    }

    this.set('events', () => new EventsHub());
    /**
     * This package is heavily used when implementing a Jimpex app, so it makes sense to register
     * it on the container, so the implementations won't need to manually install it.
     */
    this.set('statuses', () => statuses);
  }
  /**
   * Creates and configure the Express instance.
   *
   * @access protected
   * @ignore
   */
  _setupExpress() {
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
}
/**
 * Creates a new instance of {@link Jimpex}.
 *
 * @param {Partial<JimpexOptions>} [options={}]
 * Preferences to customize the application.
 * @param {?Object} [configuration=null]
 * The default configuration for the `appConfiguration` service.
 * @returns {Jimpex}
 */
const jimpex = (options = {}, configuration = null) => {
  const app = new Jimpex(options, configuration || {});
  return app.ref();
};

module.exports.Jimpex = Jimpex;
module.exports.jimpex = jimpex;
