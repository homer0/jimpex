const Jimple = require('jimple');
const ObjectUtils = require('wootils/shared/objectUtils');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const multer = require('multer');

const {
  appConfiguration,
  appLogger,
  environmentUtils,
  packageInfo,
  pathUtils,
  rootRequire,
} = require('wootils/node/providers');
const { EventsHub } = require('wootils/shared');

const commonServices = require('../services/common');
const httpServices = require('../services/http');
const utilsServices = require('../services/utils');
/**
 * Jimpex is a mix of Jimple, a Javascript port of Pimple dependency injection container, and
 * Express, one of the most popular web frameworks for Node.
 * @extends {Jimple}
 * @interface
 * @todo Implement `helmet`
 */
class Jimpex extends Jimple {
  /**
   * Class constructor.
   * @param {Boolean}        [boot=true]  If `true`, after initializing the server, it will
   *                                      immediately call the `boot` method. This can be used on
   *                                      a development environment where you would want to
   *                                      register development services/middlewares/controllers
   *                                      before the app starts.
   * @param {JimpexOptions}  [options={}] Preferences to customize the app.
   * @throws {TypeError} If instantiated directly.
   */
  constructor(boot = true, options = {}) {
    if (new.target === Jimpex) {
      throw new TypeError(
        'Jimpex is an abstract class, it can\'t be instantiated directly'
      );
    }

    super();
    /**
     * The app options.
     * @type {JimpexOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge({
      version: '0.0.0',
      filesizeLimit: '15MB',
      configuration: {
        default: null,
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
    }, options);
    /**
     * The Express app Jimpex uses under the hood.
     * @type {Express}
     * @access protected
     * @ignore
     */
    this._express = express();
    /**
     * When the app starts, this will be running instance.
     * @type {?Object}
     * @access protected
     * @ignore
     */
    this._instance = null;
    /**
     * A list of functions that return controllers and middlewares. When the app starts, the
     * queue will be processed and those controllers and middlewares added to the app.
     * The reason they are not added directly like with a regular Express implementation is that
     * services on Jimple use lazy loading, and adding middlewares and controllers as they come
     * could cause errors if they depend on services that are not yet registered.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._mountQueue = [];
    /**
     * A list of all the top routes controlled by the app. Every time a controller is mounted,
     * its route will be added here.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._controlledRoutes = [];

    this._setupCoreServices();
    this._setupExpress();
    this._setupDefaultServices();
    this._setupConfiguration();

    if (boot) {
      this.boot();
    }
  }
  /**
   * The app options.
   * @type {JimpexOptions}
   */
  get options() {
    return ObjectUtils.copy(this._options);
  }
  /**
   * The Express app Jimpex uses under the hood.
   * @type {Express}
   */
  get express() {
    return this._express;
  }
  /**
   * The server instance that gets created when the app is started.
   * @return {?Object}
   */
  get instance() {
    return this._instance;
  }
  /**
   * A list of all the top routes controlled by the app.
   * @type {Array}
   */
  get routes() {
    return ObjectUtils.copy(this._controlledRoutes);
  }
  /**
   * This is where the app would register all its specific services, middlewares and controllers.
   * @throws {Error} if not overwritten.
   * @abstract
   */
  boot() {
    throw new Error('This method must to be overwritten');
  }
  /**
   * Tries to access a service on the container, but if is not present, it won't throw an error, it
   * will just return `null`.
   * @param {string} name The name of the service.
   * @return {*}
   */
  try(name) {
    let result;
    try {
      result = this.get(name);
    } catch (ignore) {
      /**
       * The only reason we are ignoring the error is because is expected to throw an error if
       * the service is not registered.
       */
      result = null;
    }

    return result;
  }
  /**
   * Mounts a controller on a specific route.
   * @param {string}                       route      The route for the controller.
   * @param {Controller|ControllerCreator} controller The route controller.
   */
  mount(route, controller) {
    this._mountQueue.push((server) => {
      let result;
      const routes = this._reduceWithEvent(
        'controller-will-be-mounted',
        controller.connect(this, route),
        route,
        controller
      );
      if (Array.isArray(routes)) {
        // If the returned value is a list of routes, mount each single route.
        result = routes.forEach((routeRouter) => server.use(route, routeRouter));
      } else {
        // But if the returned value is not a list, it may be a router, so mount it directly.
        result = server.use(route, routes);
      }

      this._controlledRoutes.push(route);
      this._emitEvent('route-added', route);
      return result;
    });
  }
  /**
   * Adds a middleware.
   * @param {Middleware|MiddlewareCreator|ExpressMiddleware} middleware The middleware to use.
   */
  use(middleware) {
    this._mountQueue.push((server) => {
      if (typeof middleware.connect === 'function') {
        // If the middleware is from Jimpex, connect it and then use it.
        const middlewareHandler = middleware.connect(this);
        if (middlewareHandler) {
          server.use(this._reduceWithEvent(
            'middleware-will-be-used',
            middlewareHandler,
            middleware
          ));
        }
      } else {
        // But if the middleware is a regular middleware, just use it directly.
        server.use(this._reduceWithEvent(
          'middleware-will-be-used',
          middleware,
          null
        ));
      }
    });
  }
  /**
   * Starts the app server.
   * @param {function(config:AppConfiguration)} [fn] A callback function to be called when the
   *                                                 server starts.
   * @return {Object} The server instance
   */
  start(fn = () => {}) {
    const config = this.get('appConfiguration');
    const port = config.get('port');
    this._emitEvent('before-start');
    this._instance = this._express.listen(port, () => {
      this._emitEvent('start');
      this._mountResources();
      this.get('appLogger').success(`Starting on port ${port}`);
      this._emitEvent('after-start');
      const result = fn(config);
      this._emitEvent('after-start-callback');
      return result;
    });

    return this._instance;
  }
  /**
   * This is an alias of `start`. The idea is for it to be used on serverless platforms, where you
   * don't get to start your app, you just have export it.
   * @param {number}                            port The port where the app will run. In case the
   *                                                 rest of the app needs to be aware of the port,
   *                                                 this method will overwrite the `port` setting
   *                                                 on the configuration.
   * @param {function(config:AppConfiguration)} [fn] A callback function to be called when the
   *                                                 server starts.
   * @return {Object} The server instance
   */
  listen(port, fn = () => {}) {
    const config = this.get('appConfiguration');
    config.set('port', port);
    return this.start(fn, port);
  }
  /**
   * Disables the server TLS validation.
   */
  disableTLSValidation() {
    // eslint-disable-next-line no-process-env
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.get('appLogger').warning('TLS validation has been disabled');
  }
  /**
   * Stops the server instance.
   */
  stop() {
    if (this._instance) {
      this._emitEvent('before-stop');
      this._instance.close();
      this._instance = null;
      this._emitEvent('after-stop');
    }
  }
  /**
   * Registers the _'core services'_.
   * @ignore
   * @access protected
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
   * Creates and configure the Express instance.
   * @ignore
   * @access protected
   */
  _setupExpress() {
    const {
      statics,
      filesizeLimit,
      express: expressOptions,
    } = this._options;
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
      this._addStaticsFolder(
        statics.route,
        statics.folder,
        statics.onHome
      );
    }

    if (expressOptions.bodyParser) {
      this._express.use(bodyParser.json({
        limit: filesizeLimit,
      }));
      this._express.use(bodyParser.urlencoded({
        extended: true,
        limit: filesizeLimit,
      }));
    }

    if (expressOptions.multer) {
      this._express.use(multer().any());
    }

    this.set('router', this.factory(() => express.Router()));
  }
  /**
   * Helper method to add static folders to the app.
   * @param {string}  route          The route for the static folder.
   * @param {string}  [folder='']    The path to the folder. If not defined, it will use the
   *                                 value from `route`.
   * @param {Boolean} [onHome=false] If `true`, the path to the folder will be relative to where
   *                                 the app is being executed (`process.cwd()`), otherwise, it
   *                                 will be relative to where the executable file is located.
   * @access protected
   * @ignore
   */
  _addStaticsFolder(route, folder = '', onHome = false) {
    const joinFrom = onHome ? 'home' : 'app';
    const staticRoute = route.replace(/^\/+/, '');
    const staticFolder = this.get('pathUtils').joinFrom(
      joinFrom,
      folder || staticRoute
    );
    this._express.use(`/${staticRoute}`, express.static(staticFolder));
  }
  /**
   * Based on the constructor received options, register or not the default services.
   * @ignore
   * @access protected
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
  }
  /**
   * Creates the configuration service.
   * @ignore
   * @access protected
   */
  _setupConfiguration() {
    const { version, configuration: options } = this._options;
    const {
      name,
      environmentVariable,
      loadVersionFromConfiguration,
    } = options;
    let configsPath = options.path;
    if (options.hasFolder) {
      configsPath += `${options.name}/`;
    }
    const filenameFormat = options.filenameFormat
    .replace(/\[app-name\]/ig, name)
    .replace(/\[configuration-name\]/ig, '[name]');

    let defaultConfig = {};
    if (options.default) {
      defaultConfig = options.default;
    } else {
      const defaultConfigPath = `${configsPath}${options.name}.config.js`;
      defaultConfig = this.get('rootRequire')(defaultConfigPath);
    }

    if (!loadVersionFromConfiguration) {
      defaultConfig = Object.assign({ version }, defaultConfig);
    }

    this.register(appConfiguration(
      name,
      defaultConfig,
      {
        environmentVariable,
        path: configsPath,
        filenameFormat,
      }
    ));

    if (options.loadFromEnvironment) {
      this.get('appConfiguration').loadFromEnvironment();
    }

    if (loadVersionFromConfiguration) {
      this._options.version = this.get('appConfiguration').get('version');
    }
  }
  /**
   * Processes and mount all the resources on the `mountQueue`.
   * @ignore
   * @access protected
   */
  _mountResources() {
    this._mountQueue.forEach((mountFn) => mountFn(this._express));
    this._mountQueue.length = 0;
  }
  /**
   * Emits an app event with a reference to this class instance.
   * @param {string} name The name of the event.
   * @param {...*}   args   Extra parameters for the listeners.
   * @access protected
   */
  _emitEvent(name, ...args) {
    this.get('events').emit(name, ...[...args, this]);
  }
  /**
   * Sends a target object to a list of reducer events so they can modify or replace it. This
   * method also sends a reference to this class instance as the last parameter of the event.
   * @param {string} name   The name of the event.
   * @param {*}      target The targe object to reduce.
   * @param {...*}   args   Extra parameters for the listeners.
   * @return {*} An object of the same type as the `target`.
   * @access protected
   */
  _reduceWithEvent(name, target, ...args) {
    return this.get('events').reduce(name, target, ...[...args, this]);
  }
}

module.exports = Jimpex;
