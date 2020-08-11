const Jimple = require('jimple');
const ObjectUtils = require('wootils/shared/objectUtils');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const multer = require('multer');
const statuses = require('statuses');

const {
  appConfiguration,
  appLogger,
  environmentUtils,
  packageInfo,
  pathUtils,
  rootRequire,
} = require('wootils/node/providers');
const { EventsHub } = require('wootils/shared');

const { eventNames } = require('../constants');
const commonServices = require('../services/common');
const httpServices = require('../services/http');
const utilsServices = require('../services/utils');
const { escapeForRegExp } = require('../utils/functions');
/**
 * Jimpex is a mix of Jimple, a Javascript port of Pimple dependency injection container, and
 * Express, one of the most popular web frameworks for Node.
 *
 * @augments Jimple
 * @todo Implement `helmet`.
 */
class Jimpex extends Jimple {
  /**
   * @param {boolean}                [boot=true]  If `true`, after initializing the server, it will
   *                                              immediately call the `boot` method. This can be
   *                                              used on a development environment where you
   *                                              would want to register development
   *                                              services/middlewares/controllers before the
   *                                              application starts.
   * @param {Partial<JimpexOptions>} [options={}] Preferences to customize the application.
   * @throws {TypeError} If instantiated directly.
   */
  constructor(boot = true, options = {}) {
    if (new.target === Jimpex) {
      throw new TypeError(
        'Jimpex is an abstract class, it can\'t be instantiated directly',
      );
    }

    super();
    /**
     * The application options.
     *
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
     * The Express application Jimpex uses under the hood.
     *
     * @type {Express}
     * @access protected
     * @ignore
     */
    this._express = express();
    /**
     * When the application starts, this will be the instance of the server.
     *
     * @type {?Server}
     * @access protected
     * @ignore
     */
    this._instance = null;
    /**
     * A list of functions that return controllers and middlewares. When the application starts,
     * the queue will be processed and those controllers and middlewares will be added to the
     * server instance
     * The reason they are not added directly like with a regular Express implementation is that
     * services on Jimple use lazy loading, and adding middlewares and controllers as they come
     * could cause errors if they depend on services that are not yet registered.
     *
     * @type {Function[]}
     * @access protected
     * @ignore
     */
    this._mountQueue = [];
    /**
     * A list with all the top routes controlled by the application. Every time a controller is
     * mounted, its route will be added here.
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

    if (boot) {
      this.boot();
    }
  }
  /**
   * This is where the app would register all its specific services, middlewares and controllers.
   *
   * @throws {Error} If not overwritten.
   * @abstract
   */
  boot() {
    throw new Error('This method must be overwritten');
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
   * This is an alias of `start`. The idea is for it to be used on serverless platforms, where you
   * don't get to start your app, you just have export it.
   *
   * @param {number}              port The port where the app will run. In case the rest of the app
   *                                   needs to be aware of the port, this method will overwrite
   *                                   the `port` setting on the configuration.
   * @param {JimpexStartCallback} [fn] A callback function to be called when the server starts.
   * @returns {Server} The server instance.
   */
  listen(port, fn = () => {}) {
    const config = this.get('appConfiguration');
    config.set('port', port);
    return this.start(fn, port);
  }
  /**
   * Mounts a controller on a specific route.
   *
   * @param {string}     route      The route for the controller.
   * @param {Controller} controller The route controller.
   */
  mount(route, controller) {
    this._mountQueue.push((server) => {
      let result;
      const routes = this._reduceWithEvent(
        'controllerWillBeMounted',
        controller.connect(this, route),
        route,
        controller,
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
   * Starts the app server.
   *
   * @param {JimpexStartCallback} [fn] A callback function to be called when the server starts.
   * @returns {Object} The server instance.
   */
  start(fn = () => {}) {
    const config = this.get('appConfiguration');
    const port = config.get('port');
    this._emitEvent('beforeStart');
    this._instance = this._express.listen(port, () => {
      this._emitEvent('start');
      this._mountResources();
      this.get('appLogger').success(`Starting on port ${port}`);
      this._emitEvent('afterStart');
      const result = fn(config);
      this._emitEvent('afterStartCallback');
      return result;
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
   * Tries to access a resource on the container, but if is not present, it won't throw an error,
   * it will just return `null`.
   *
   * @param {string} name The name of the resource.
   * @returns {*}
   * @throws {Error} If there's an error other than the one generated when the resource doesn't
   *                 exist.
   */
  try(name) {
    let result;
    try {
      result = this.get(name);
    } catch (error) {
      /**
       * Validate if the received error is from Jimple not being able to find the service, or from
       * something else; if it's not about the module not being registered, throw the error.
       */
      const expression = new RegExp(escapeForRegExp(`identifier "${name}" is not defined`), 'i');
      if (error.message && error.message.match(expression)) {
        result = null;
      } else {
        throw error;
      }
    }

    return result;
  }
  /**
   * Adds a middleware.
   *
   * @param {Middleware|ExpressMiddleware} middleware The middleware to use.
   */
  use(middleware) {
    this._mountQueue.push((server) => {
      if (typeof middleware.connect === 'function') {
        // If the middleware is from Jimpex, connect it and then use it.
        const middlewareHandler = middleware.connect(this);
        if (middlewareHandler) {
          server.use(this._reduceWithEvent(
            'middlewareWillBeUsed',
            middlewareHandler,
            middleware,
          ));
        }
      } else {
        // But if the middleware is a regular middleware, just use it directly.
        server.use(this._reduceWithEvent(
          'middlewareWillBeUsed',
          middleware,
          null,
        ));
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
   * @param {string}  route          The route for the static folder.
   * @param {string}  [folder='']    The path to the folder. If not defined, it will use the
   *                                 value from `route`.
   * @param {boolean} [onHome=false] If `true`, the path to the folder will be relative to where
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
      folder || staticRoute,
    );
    this._express.use(`/${staticRoute}`, express.static(staticFolder));
  }
  /**
   * Emits an app event with a reference to this class instance.
   *
   * @param {string} name The name of the event on {@link JimpexEvents}.
   * @param {...*}   args   Extra parameters for the listeners.
   * @access protected
   * @ignore
   */
  _emitEvent(name, ...args) {
    this.get('events').emit(eventNames[name], ...[...args, this]);
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
   * Sends a target object to a list of reducer events so they can modify or replace it. This
   * method also sends a reference to this class instance as the last parameter of the event.
   *
   * @param {string} name   The name of the event on {@link JimpexEvents}.
   * @param {*}      target The targe object to reduce.
   * @param {...*}   args   Extra parameters for the listeners.
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
      defaultConfig = { version, ...defaultConfig };
    }

    this.register(appConfiguration(
      name,
      defaultConfig,
      {
        environmentVariable,
        path: configsPath,
        filenameFormat,
      },
    ));

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
        statics.onHome,
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
}

module.exports = Jimpex;
