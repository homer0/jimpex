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

const apiServices = require('../services/api');
const commonServices = require('../services/common');
const httpServices = require('../services/http');
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
     */
    this.options = ObjectUtils.merge({
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
        api: true,
        common: true,
        http: true,
      },
    }, options);
    /**
     * The Express app.
     * @type {Express}
     */
    this.express = express();
    /**
     * When the app starts, this will be running instance.
     * @type {Object}
     */
    this.instance = null;
    /**
     * A list of functions that return controllers and middlewares. When the app starts, the
     * queue will be processed and those controllers and middlewares added to the app.
     * The reason they are not added directly like with a regular Express implementation is that
     * services on Jimple use lazy loading, and adding middlewares and controllers as they come
     * could cause errors if they depend on services that are not yet registered.
     * @type {Array}
     */
    this.mountQueue = [];

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
   * @throws {Error} if not overwritten.
   * @abstract
   */
  boot() {
    throw new Error('This method must to be overwritten');
  }
  /**
   * Mount a controller on a route point.
   * @param {string}                       point      The route for the controller.
   * @param {Controller|ControllerCreator} controller The route controller.
   */
  mount(point, controller) {
    this.mountQueue.push(
      (server) => controller.connect(this, point).forEach(
        (route) => server.use(point, route)
      )
    );
  }
  /**
   * Add a middleware.
   * @param {Middleware|MiddlewareCreator} middleware The middleware to use.
   */
  use(middleware) {
    this.mountQueue.push((server) => {
      const middlewareHandler = middleware.connect(this);
      if (middlewareHandler) {
        server.use(middlewareHandler);
      }
    });
  }
  /**
   * Start the app server.
   * @param {function(config:AppConfiguration)} [fn] A callback function to be called when the
   *                                                 server starts.
   * @return {Object} The server instance
   */
  start(fn = () => {}) {
    const config = this.get('appConfiguration');
    const port = config.get('port');
    this.emitEvent('before-start');
    this.instance = this.express.listen(port, () => {
      this.emitEvent('start');
      this._mountResources();
      this.get('appLogger').success(`Starting on port ${port}`);
      this.emitEvent('after-start');
      const result = fn(config);
      this.emitEvent('after-start-callback');
      return result;
    });

    return this.instance;
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
   * Emit an app event with a reference to this class instance.
   * @param {string} name The name of the event.
   */
  emitEvent(name) {
    this.get('events').emit(name, this);
  }
  /**
   * Disable the server TLS validation.
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
    if (this.instance) {
      this.emitEvent('before-stop');
      this.instance.close();
      this.instance = null;
      this.emitEvent('after-stop');
    }
  }
  /**
   * Register the _'core services'_.
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
   * Create and configure the Express instance.
   * @ignore
   * @access protected
   */
  _setupExpress() {
    const {
      statics,
      filesizeLimit,
      express: expressOptions,
    } = this.options;
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
      const { onHome, route, folder } = statics;
      const joinFrom = onHome ? 'home' : 'app';
      const staticsRoute = route.startsWith('/') ? route.substr(1) : route;
      const staticsFolderPath = this.get('pathUtils').joinFrom(joinFrom, folder || staticsRoute);
      this.express.use(`/${staticsRoute}`, express.static(staticsFolderPath));
    }

    if (expressOptions.bodyParser) {
      this.express.use(bodyParser.json({
        limit: filesizeLimit,
      }));
      this.express.use(bodyParser.urlencoded({
        extended: true,
        limit: filesizeLimit,
      }));
    }

    if (expressOptions.multer) {
      this.express.use(multer().any());
    }

    this.set('router', this.factory(() => express.Router()));
  }
  /**
   * Based on the constructor received options, register or not the default services.
   * @ignore
   * @access protected
   */
  _setupDefaultServices() {
    const { defaultServices } = this.options;

    if (defaultServices.api) {
      this.register(apiServices);
    }

    if (defaultServices.common) {
      this.register(commonServices);
    }

    if (defaultServices.http) {
      this.register(httpServices);
    }

    this.set('events', () => new EventsHub());
  }
  /**
   * Create the configuration service.
   * @ignore
   * @access protected
   */
  _setupConfiguration() {
    const { version, configuration: options } = this.options;
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
      this.options.version = this.get('appConfiguration').get('version');
    }
  }
  /**
   * Process and mount all the resources on the `mountQueue`.
   * @ignore
   * @access protected
   */
  _mountResources() {
    this.mountQueue.forEach((mountFn) => mountFn(this.express));
    this.mountQueue.length = 0;
  }
}

module.exports = Jimpex;
