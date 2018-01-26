const Jimple = require('jimple');
const extend = require('extend');
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
    this.options = extend(true, {
      version: '0.0.0',
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
        onHome: true,
        folder: 'statics',
      },
      filesizeLimit: '15MB',
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
   * @param {string}     point      The route for the controller.
   * @param {Controller} controller The route controller.
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
   * @param {Middleware} middleware [description]
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
      const { onHome, folder } = statics;
      const joinFrom = onHome ? 'home' : 'app';
      const staticsFolderPath = this.get('pathUtils').joinFrom(joinFrom, folder);
      this.express.use(`/${folder}`, express.static(staticsFolderPath));
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
      this.register(apiServices.all);
    }

    if (defaultServices.common) {
      this.register(commonServices.all);
    }

    if (defaultServices.http) {
      this.register(httpServices.all);
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
