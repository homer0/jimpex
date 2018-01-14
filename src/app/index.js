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

class Jimpex extends Jimple {
  constructor(boot = true, options = {}) {
    if (new.target === Jimpex) {
      throw new TypeError(
        'Jimpex is an abstract class, it can\'t be instantiated directly'
      );
    }

    super();

    const home = process.cwd();
    this.options = extend(true, {
      version: '0.0.0',
      configuration: {
        default: null,
        name: 'app',
        path: 'config/',
        hasFolder: false,
        environmentVariable: 'CONFIG',
        loadFromEnvironment: true,
        filenameFormat: '[app-name].[configuration-name].config.js',
      },
      statics: {
        enabled: true,
        onHome: true,
        folder: 'statics',
      },
      filesizeLimit: '15MB',
      locations: {
        home,
        project: home,
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
    this.instance = null;
    this.mountQueue = [];

    this._setupCoreServices();
    this._setupExpress();
    this._setupDefaultServices();
    this._setupConfiguration();

    if (boot) {
      this.boot();
    }
  }

  boot() {
    throw new Error('This method must to be overwritten');
  }

  mount(point, controller) {
    this.mountQueue.push(
      (server) => controller.connect(this, point).forEach(
        (route) => server.use(point, route)
      )
    );
  }

  use(middleware) {
    this.mountQueue.push((server) => {
      const middlewareHandler = middleware.connect(this);
      if (middlewareHandler) {
        server.use(middlewareHandler);
      }
    });
  }

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

  emitEvent(name) {
    this.get('events').emit(name, this);
  }

  disableTLSValidation() {
    // eslint-disable-next-line no-process-env
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    this.get('appLogger').warning('TLS validation has been disabled');
  }

  stop() {
    if (this.instance) {
      this.emitEvent('before-stop');
      this.instance.close();
      this.instance = null;
      this.emitEvent('after-stop');
    }
  }

  _setupCoreServices() {
    this.register(appLogger);
    this.register(environmentUtils);
    this.register(packageInfo);
    this.register(pathUtils);
    this.register(rootRequire);
  }

  _setupExpress() {
    this.express = express();
    const {
      statics,
      filesizeLimit,
      express: expressOptions,
    } = this.options;

    if (expressOptions.trustProxy) {
      this.express.set('trust proxy');
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

    this.set('router', this.factory(() => express.router()));
  }

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

  _setupConfiguration() {
    const { version, configuration: options } = this.options;
    const { name, environmentVariable } = options;
    let configsPath = options.path;
    if (options.hasFolder) {
      configsPath += `${options.name}/`;
    }
    const filenameFormat = options.filenameFormat
    .replace(/\[app-name\]/ig, name)
    .replace(/\[configuration-name\]/ig, '[name]');

    let defaultConfig = {};
    if (options.defaultConfiguration) {
      defaultConfig = options.defaultConfiguration;
    } else {
      const defaultConfigPath = `${configsPath}${options.name}.config.js`;
      defaultConfig = this.get('rootRequire')(defaultConfigPath);
    }

    this.register(appConfiguration(
      name,
      Object.assign({ version }, defaultConfig),
      {
        environmentVariable,
        path: configsPath,
        filenameFormat,
      }
    ));

    if (options.loadFromEnvironment) {
      this.get('appConfiguration').loadFromEnvironment();
    }
  }

  _mountResources() {
    this.mountQueue.forEach((mountFn) => mountFn(this.express));
  }
}

module.exports = Jimpex;
