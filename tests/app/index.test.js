jest.mock('https');
jest.mock('fs-extra');
jest.mock('spdy');
jest.mock('jimple', () => require('../mocks/jimple.mock'));
jest.mock('express', () => require('../mocks/express.mock'));
jest.mock('compression', () => require('../mocks/compression.mock'));
jest.mock('multer', () => require('../mocks/multer.mock'));
jest.mock('body-parser', () => require('../mocks/bodyParser.mock'));
jest.mock('wootils/node/providers', () => require('../mocks/wootils.mock'));
jest.mock('../../src/services/common', () => 'commonServices');
jest.mock('../../src/services/http', () => 'httpServices');
jest.mock('../../src/services/utils', () => 'utilsServices');
jest.unmock('../../src/app');
jest.unmock('../../src/utils/functions');

const path = require('path');
const https = require('https');
const statuses = require('statuses');
const fs = require('fs-extra');
const spdy = require('spdy');

const { EventsHub } = require('wootils/shared');

const JimpleMock = require('jimple');
const expressMock = require('express');
const compressionMock = require('compression');
const multerMock = require('multer');
const bodyParserMock = require('body-parser');
const wootilsMock = require('wootils/node/providers');

const { Jimpex, jimpex } = require('../../src/app');
const { eventNames } = require('../../src/constants');

const originalNodeTLSRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

describe('app:Jimpex', () => {
  beforeEach(() => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalNodeTLSRejectUnauthorized;
    JimpleMock.reset();
    expressMock.reset();
    compressionMock.reset();
    multerMock.reset();
    bodyParserMock.reset();
    wootilsMock.reset();
    fs.readFileSync.mockReset();
    https.createServer.mockReset();
    spdy.createServer.mockReset();
  });

  it('should be able to be instantiated', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {
      port: 2509,
    };
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const version = 'latest';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    let eventsService = null;
    let statusesService = null;
    const expectedServices = [
      'appLogger',
      'environmentUtils',
      'packageInfo',
      'pathUtils',
      'rootRequire',
      'utilsServices',
      'commonServices',
      'httpServices',
      'appConfiguration',
    ];
    const expectedSetServices = [
      'router',
      'events',
      'statuses',
    ];
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    // When
    sut = new Jimpex();
    // Then
    expect(sut).toBeInstanceOf(Jimpex);
    expect(sut.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service) => {
      expect(sut.register).toHaveBeenCalledWith(service);
    });
    expect(sut.express).toBe(expressMock.mocks);
    expect(expressMock).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.enable).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.enable).toHaveBeenCalledWith('trust proxy');
    expect(expressMock.mocks.disable).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.disable).toHaveBeenCalledWith('x-powered-by');
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedMiddlewares.length);
    expectedMiddlewares.forEach((middlewareCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...middlewareCall);
    });
    expect(compressionMock).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.static).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.static).toHaveBeenCalledWith(expectedStaticsFolder);
    expect(bodyParserMock.json).toHaveBeenCalledTimes(1);
    expect(bodyParserMock.json).toHaveBeenCalledWith({
      limit: expect.any(String),
    });
    expect(bodyParserMock.urlencoded).toHaveBeenCalledTimes(1);
    expect(bodyParserMock.urlencoded).toHaveBeenCalledWith({
      extended: true,
      limit: expect.any(String),
    });
    expect(multerMock).toHaveBeenCalledTimes(1);
    expect(multerMock.mocks.any).toHaveBeenCalledTimes(1);
    expect(sut.set).toHaveBeenCalledTimes(expectedSetServices.length);
    expect(sut.set).toHaveBeenCalledWith('router', 'router');
    expect(sut.set).toHaveBeenCalledWith('events', expect.any(Function));
    [, [, eventsService], [, statusesService]] = sut.set.mock.calls;
    expect(eventsService()).toBeInstanceOf(EventsHub);
    expect(statusesService()).toEqual(statuses);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration: defaultConfig,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', sut.options.statics.route);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('version');
  });

  it('should call a custom boot method when subclassed', () => {
    // Given
    const bootMock = jest.fn();
    const initMock = jest.fn();
    class Sut extends Jimpex {
      boot() {
        bootMock();
      }
      _init() {
        initMock();
      }
    }
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {
      port: 2509,
    };
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const version = 'latest';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = new Sut();
    // Then
    expect(sut).toBeInstanceOf(Sut);
    expect(sut).toBeInstanceOf(Jimpex);
    expect(bootMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t call `boot` is option is set to false', () => {
    // Given
    const bootMock = jest.fn();
    const initMock = jest.fn();
    class Sut extends Jimpex {
      boot() {
        bootMock();
      }
      _init() {
        initMock();
      }
    }
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Sut({
      boot: false,
    });
    // Then
    expect(bootMock).toHaveBeenCalledTimes(0);
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it('should overwrite the default options using the protected method', () => {
    // Given
    class Sut extends Jimpex {
      _initOptions() {
        return {
          configuration: {
            loadFromEnvironment: false,
          },
        };
      }
    }
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {
      port: 2509,
    };
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const version = 'latest';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = new Sut();
    // Then
    expect(sut).toBeInstanceOf(Sut);
    expect(sut).toBeInstanceOf(Jimpex);
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t set \'trust proxy\' if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      express: {
        trustProxy: false,
      },
    });
    // Then
    expect(expressMock.mocks.enable).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t remove the \'x-powered-by\' if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      express: {
        disableXPoweredBy: false,
      },
    });
    // Then
    expect(expressMock.mocks.disable).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the compression middleware if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      express: {
        compression: false,
      },
    });
    // Then
    expect(compressionMock).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the bodyParser middleware if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      express: {
        bodyParser: false,
      },
    });
    // Then
    expect(bodyParserMock.json).toHaveBeenCalledTimes(0);
    expect(bodyParserMock.urlencoded).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the multer middleware if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      express: {
        multer: false,
      },
    });
    // Then
    expect(multerMock).toHaveBeenCalledTimes(0);
    expect(multerMock.mocks.any).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the static middleware if its flag is `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    // When
    // eslint-disable-next-line no-new
    new Jimpex({
      statics: {
        enabled: false,
      },
    });
    // Then
    expect(expressMock.static).toHaveBeenCalledTimes(0);
  });

  it('should be able to set the statics route relative to the home directory', () => {
    /**
     * App directory: Where the executable file is located.
     * Home directory: Where the app is executed from (`process.cwd`).
     */
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = new Jimpex({
      statics: {
        onHome: true,
      },
    });
    // Then
    expect(expressMock.static).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('home', sut.options.statics.route);
  });

  it('should be able to set a the statics folder with a path different from the route', () => {
    /**
     * App directory: Where the executable file is located.
     * Home directory: Where the app is executed from (`process.cwd`).
     */
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const staticsRoute = '/some/statics';
    const staticsFolder = '../statics';
    let sut = null;
    const expectedMiddlewares = [
      ['compression-middleware'],
      [staticsRoute, path.join('home', staticsFolder)],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    // When
    sut = new Jimpex({
      statics: {
        onHome: true,
        route: staticsRoute,
        folder: staticsFolder,
      },
    });
    // Then
    expect(sut.options.statics.folder).toBe(staticsFolder);
    expect(expressMock.static).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('home', staticsFolder);
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedMiddlewares.length);
    expectedMiddlewares.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('should be able to add an extra statics folder', () => {
    /**
     * App directory: Where the executable file is located.
     * Home directory: Where the app is executed from (`process.cwd`).
     */
    // Given
    const customStatic = 'my-static';
    class Sut extends Jimpex {
      boot() {
        this._addStaticsFolder(customStatic);
      }
    }
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const staticsRoute = '/some/statics';
    const staticsFolder = '../statics';
    let sut = null;
    const expectedMiddlewares = [
      ['compression-middleware'],
      [staticsRoute, path.join('home', staticsFolder)],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
      [`/${customStatic}`, path.join('app', customStatic)],
    ];
    // When
    sut = new Sut({
      statics: {
        onHome: true,
        route: staticsRoute,
        folder: staticsFolder,
      },
    });
    // Then
    expect(sut.options.statics.folder).toBe(staticsFolder);
    expect(expressMock.static).toHaveBeenCalledTimes(2);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(2);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('home', staticsFolder);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', customStatic);
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedMiddlewares.length);
    expectedMiddlewares.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('shouldn\'t add the default services if their flags are `false`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    const expectedServices = [
      'appLogger',
      'environmentUtils',
      'packageInfo',
      'pathUtils',
      'rootRequire',
      'appConfiguration',
    ];
    // When
    sut = new Jimpex({
      defaultServices: {
        common: false,
        http: false,
        utils: false,
      },
    });
    // Then
    expect(sut.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service) => {
      expect(sut.register).toHaveBeenCalledWith(service);
    });
  });

  it('should be able to look for configurations', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const version = 'version-on-file';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = new Jimpex({
      configuration: {
        hasFolder: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration: defaultConfig,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: sut.options.configuration.path,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });

  it('should inject the app version on the default configuration', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const version = 'some-version';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = new Jimpex({
      version,
      configuration: {
        hasFolder: false,
        loadVersionFromConfiguration: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration: { ...defaultConfig, version },
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: sut.options.configuration.path,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
  });

  it('should receive the default configuration from the constructor parameter', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const version = 'version-on-file';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const defaultConfiguration = {
      charito: 25092015,
    };
    let sut = null;
    // When
    sut = new Jimpex({}, defaultConfiguration);
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });

  it('should receive the default configuration on the configuration options', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const version = 'version-on-file';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const defaultConfiguration = {
      charito: 25092015,
    };
    let sut = null;
    // When
    sut = new Jimpex({
      configuration: {
        default: defaultConfiguration,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });

  it('shouldn\'t load the configuration based on an env var if the option is disabled', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const version = 'some-version';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const defaultConfiguration = {
      charito: 25092015,
    };
    let sut = null;
    // When
    sut = new Jimpex({
      configuration: {
        default: defaultConfiguration,
        loadFromEnvironment: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(0);
    expect(sut.options.version).toBe(version);
  });

  it('should disable TL validation', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const appLogger = {
      warning: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    // When
    sut = new Jimpex();
    sut.disableTLSValidation();
    // Then
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0');
    expect(appLogger.warning).toHaveBeenCalledTimes(1);
    expect(appLogger.warning).toHaveBeenCalledWith('TLS validation has been disabled');
  });

  it('should start and stop the server', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    let runningInstance = null;
    const expectedEvents = [
      eventNames.beforeStart,
      eventNames.start,
      eventNames.afterStart,
      eventNames.afterStartCallback,
      eventNames.beforeStop,
      eventNames.afterStop,
    ];
    // When
    sut = new Jimpex();
    sut.start();
    runningInstance = sut.instance;
    sut.stop();
    // Then
    expect(runningInstance).toEqual({
      close: expect.any(Function),
    });
    expect(events.emit).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventName) => {
      expect(events.emit).toHaveBeenCalledWith(eventName, sut);
    });
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success)
    .toHaveBeenCalledWith(`Starting on port ${configuration.port}`);
    expect(expressMock.mocks.listen).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.listen).toHaveBeenCalledWith(
      configuration.port,
      expect.any(Function),
    );
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(1);
  });

  it('should start the server and fire a custom callback', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const callback = jest.fn();
    let sut = null;
    // When
    sut = new Jimpex();
    sut.start(callback);
    // Then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(appConfiguration);
  });

  it('should start and stop the server with HTTPS enabled', () => {
    // Given
    const files = {
      keyFile: {
        name: 'key-file',
        contents: 'key-file-contents',
      },
      certFile: {
        name: 'cert-file',
        contents: 'cert-file-contents',
      },
    };
    fs.readFileSync.mockImplementationOnce(() => files.certFile.contents);
    fs.readFileSync.mockImplementationOnce(() => files.keyFile.contents);
    https.createServer.mockImplementationOnce((_, server) => server);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      https: {
        enabled: true,
        credentials: {
          key: files.keyFile.name,
          cert: files.certFile.name,
        },
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [null, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    let runningInstance = null;
    // When
    sut = new Jimpex();
    sut.start();
    runningInstance = sut.instance;
    sut.stop();
    // Then
    expect(runningInstance).toEqual({
      close: expect.any(Function),
    });
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenNthCalledWith(1, path.join('home', files.certFile.name));
    expect(fs.readFileSync).toHaveBeenNthCalledWith(2, path.join('home', files.keyFile.name));
    expect(https.createServer).toHaveBeenCalledTimes(1);
    expect(https.createServer).toHaveBeenCalledWith(
      {
        cert: files.certFile.contents,
        key: files.keyFile.contents,
      },
      expressMock.mocks,
    );
    expect(expressMock.mocks.listen).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.listen).toHaveBeenCalledWith(
      configuration.port,
      expect.any(Function),
    );
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(1);
  });

  it('should start and stop the server with HTTPS and HTTP2 enabled', () => {
    // Given
    const files = {
      keyFile: {
        name: 'key-file',
        contents: 'key-file-contents',
      },
      certFile: {
        name: 'cert-file',
        contents: 'cert-file-contents',
      },
    };
    fs.readFileSync.mockImplementationOnce(() => files.certFile.contents);
    fs.readFileSync.mockImplementationOnce(() => files.keyFile.contents);
    spdy.createServer.mockImplementationOnce((_, server) => server);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      https: {
        enabled: true,
        credentials: {
          key: files.keyFile.name,
          cert: files.certFile.name,
        },
      },
      http2: {
        enabled: true,
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [configuration.http2, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    let runningInstance = null;
    // When
    sut = new Jimpex();
    sut.start();
    runningInstance = sut.instance;
    sut.stop();
    // Then
    expect(runningInstance).toEqual({
      close: expect.any(Function),
    });
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenNthCalledWith(1, path.join('home', files.certFile.name));
    expect(fs.readFileSync).toHaveBeenNthCalledWith(2, path.join('home', files.keyFile.name));
    expect(spdy.createServer).toHaveBeenCalledTimes(1);
    expect(spdy.createServer).toHaveBeenCalledWith(
      {
        cert: files.certFile.contents,
        key: files.keyFile.contents,
      },
      expressMock.mocks,
    );
    expect(expressMock.mocks.listen).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.listen).toHaveBeenCalledWith(
      configuration.port,
      expect.any(Function),
    );
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(1);
  });

  it('should send custom options to Spdy for HTTP2', () => {
    // Given
    const files = {
      keyFile: {
        name: 'key-file',
        contents: 'key-file-contents',
      },
      certFile: {
        name: 'cert-file',
        contents: 'cert-file-contents',
      },
    };
    fs.readFileSync.mockImplementationOnce(() => files.certFile.contents);
    fs.readFileSync.mockImplementationOnce(() => files.keyFile.contents);
    spdy.createServer.mockImplementationOnce((_, server) => server);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      https: {
        enabled: true,
        credentials: {
          onHome: false,
          key: files.keyFile.name,
          cert: files.certFile.name,
        },
      },
      http2: {
        enabled: true,
        spdy: {
          charito: ':D',
          pili: ':D',
        },
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [configuration.http2, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    let runningInstance = null;
    // When
    sut = new Jimpex();
    sut.start();
    runningInstance = sut.instance;
    sut.stop();
    // Then
    expect(runningInstance).toEqual({
      close: expect.any(Function),
    });
    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenNthCalledWith(1, path.join('app', files.certFile.name));
    expect(fs.readFileSync).toHaveBeenNthCalledWith(2, path.join('app', files.keyFile.name));
    expect(spdy.createServer).toHaveBeenCalledTimes(1);
    expect(spdy.createServer).toHaveBeenCalledWith(
      {
        cert: files.certFile.contents,
        key: files.keyFile.contents,
        spdy: configuration.http2.spdy,
      },
      expressMock.mocks,
    );
    expect(expressMock.mocks.listen).toHaveBeenCalledTimes(1);
    expect(expressMock.mocks.listen).toHaveBeenCalledWith(
      configuration.port,
      expect.any(Function),
    );
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if HTTPS is enabled but there are no credentials', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      http2: {},
      https: {
        enabled: true,
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [configuration.http2, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    // When/Then
    expect(() => new Jimpex().start())
    .toThrow(/The `credentials` object on the HTTPS settings is missing/i);
  });

  it('should throw an error if HTTP2 is enabled but HTTPS is not', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      http2: {
        enabled: true,
      },
      https: {
        enabled: false,
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [configuration.http2, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    // When/Then
    expect(() => new Jimpex().start())
    .toThrow(/HTTP2 requires for HTTPS to be enabled/i);
  });

  it('should throw an error if HTTPS is enabled but there are no credentials', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
      http2: {},
      https: {
        enabled: true,
        credentials: [],
      },
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [configuration.http2, configuration.https] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    // When/Then
    expect(() => new Jimpex().start())
    .toThrow(/No credentials were found for HTTPS/i);
  });

  it('should start the server using `listen`', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [] :
          configuration[prop]
      )),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    // When
    sut = new Jimpex();
    sut.listen();
    // Then
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(`Starting on port ${configuration.port}`);
  });

  it('should start the server using `listen` with a custom port', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const customPort = 8080;
    const configuration = {
      port: 2509,
      changes: {},
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [] :
          configuration.changes[prop] || configuration[prop]
      )),
      set: jest.fn((prop, value) => {
        configuration.changes[prop] = value;
      }),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    // When
    sut = new Jimpex();
    sut.listen(customPort);
    // Then
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(`Starting on port ${customPort}`);
    expect(appConfiguration.set).toHaveBeenCalledTimes(1);
    expect(appConfiguration.set).toHaveBeenCalledWith('port', customPort);
    expect(configuration.changes.port).toBe(customPort);
  });

  it('should start the server using `listen` and fire a custom callback', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const customPort = 8080;
    const configuration = {
      port: 2509,
      changes: {},
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (
        Array.isArray(prop) ?
          [] :
          configuration.changes[prop] || configuration[prop]
      )),
      set: jest.fn((prop, value) => {
        configuration.changes[prop] = value;
      }),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const callback = jest.fn();
    let sut = null;
    // When
    sut = new Jimpex();
    sut.listen(customPort, callback);
    // Then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(appConfiguration);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(`Starting on port ${customPort}`);
    expect(appConfiguration.set).toHaveBeenCalledTimes(1);
    expect(appConfiguration.set).toHaveBeenCalledWith('port', customPort);
    expect(configuration.changes.port).toBe(customPort);
  });

  it('shouldn\'t do anything when trying to stop the server without starting it', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    // When
    sut = new Jimpex();
    sut.stop();
    // Then
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(0);
  });

  it('should try to access a service that may or may not be registered', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    let resultAvailable = null;
    let resultUnavailable = null;
    // When
    sut = new Jimpex();
    resultAvailable = sut.try('events');
    resultUnavailable = sut.try('randomService');
    // Then
    expect(resultAvailable).toBe(events);
    expect(resultUnavailable).toBeNull();
  });

  it('should mount a controller', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
      reduce: jest.fn((eventName, router) => router),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const routes = ['route-a', 'route-b'];
    const route = '/api';
    const controller = {
      connect: jest.fn(() => routes),
    };
    let sut = null;
    let routesList = null;
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    const expectedUseCalls = [
      ...expectedMiddlewares,
      ...routes.map((routeRouter) => [route, routeRouter]),
    ];
    const expectedEvents = [
      [eventNames.beforeStart],
      [eventNames.start],
      [eventNames.routeAdded, route],
      [eventNames.afterStart],
      [eventNames.afterStartCallback],
    ];
    // When
    sut = new Jimpex();
    sut.mount(route, controller);
    sut.start();
    routesList = sut.routes;
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
    expect(events.emit).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventInformation) => {
      expect(events.emit).toHaveBeenCalledWith(...[...eventInformation, sut]);
    });
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      eventNames.controllerWillBeMounted,
      routes,
      route,
      controller,
      sut,
    );
    expect(routesList).toEqual([route]);
  });

  it('should mount a controller router', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
      reduce: jest.fn((eventName, router) => router),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const router = 'my-router';
    const route = '/api';
    const controller = {
      connect: jest.fn(() => router),
    };
    let sut = null;
    let routesList = null;
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    const expectedUseCalls = [
      ...expectedMiddlewares,
      ...[[route, router]],
    ];
    const expectedEvents = [
      [eventNames.beforeStart],
      [eventNames.start],
      [eventNames.routeAdded, route],
      [eventNames.afterStart],
      [eventNames.afterStartCallback],
    ];
    // When
    sut = new Jimpex();
    sut.mount(route, controller);
    sut.start();
    routesList = sut.routes;
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
    expect(events.emit).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventInformation) => {
      expect(events.emit).toHaveBeenCalledWith(...[...eventInformation, sut]);
    });
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      eventNames.controllerWillBeMounted,
      router,
      route,
      controller,
      sut,
    );
    expect(routesList).toEqual([route]);
  });

  it('should mount a middleware', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
      reduce: jest.fn((eventName, middleware) => middleware),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const middlewareFn = 'custom-middleware';
    const middleware = {
      connect: jest.fn(() => middlewareFn),
    };
    let sut = null;
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    const expectedUseCalls = [
      ...expectedMiddlewares,
      [middlewareFn],
    ];
    // When
    sut = new Jimpex();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      eventNames.middlewareWillBeUsed,
      middlewareFn,
      middleware,
      sut,
    );
  });

  it('should mount an Express middleware', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
      reduce: jest.fn((eventName, middleware) => middleware),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const middleware = 'express-middleware';
    let sut = null;
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    const expectedUseCalls = [
      ...expectedMiddlewares,
      [middleware],
    ];
    // When
    sut = new Jimpex();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
    expect(events.reduce).toHaveBeenCalledTimes(1);
    expect(events.reduce).toHaveBeenCalledWith(
      eventNames.middlewareWillBeUsed,
      middleware,
      null,
      sut,
    );
  });

  it('shouldn\'t mount a middleware if its `connect` method returned a falsy value', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const defaultConfig = {};
    const rootRequire = jest.fn(() => defaultConfig);
    JimpleMock.service('rootRequire', rootRequire);
    const configuration = {
      port: 2509,
    };
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn((prop) => (Array.isArray(prop) ? [] : configuration[prop])),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const events = {
      emit: jest.fn(),
    };
    JimpleMock.service('events', events);
    const appLogger = {
      success: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    const middleware = {
      connect: jest.fn(() => null),
    };
    let sut = null;
    const expectedStaticsFolder = 'app/statics';
    const expectedMiddlewares = [
      ['compression-middleware'],
      ['/statics', expectedStaticsFolder],
      ['body-parser-json'],
      ['body-parser-urlencoded'],
      ['multer-any'],
    ];
    // When
    sut = new Jimpex();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedMiddlewares.length);
    expectedMiddlewares.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('should be able to be instantiated from a function', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    JimpleMock.service('rootRequire', jest.fn());
    const version = 'latest';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    let sut = null;
    // When
    sut = jimpex();
    // Then
    expect(sut).toBeInstanceOf(Jimpex);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration: {},
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
  });

  it('should support custom options and configuration from the function', () => {
    // Given
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => path.join(from, rest)),
    };
    JimpleMock.service('pathUtils', pathUtils);
    const version = 'version-on-file';
    const appConfiguration = {
      loadFromEnvironment: jest.fn(),
      get: jest.fn(() => version),
    };
    JimpleMock.service('appConfiguration', appConfiguration);
    const boot = false;
    const defaultConfiguration = {
      charito: 25092015,
    };
    let sut = null;
    // When
    sut = jimpex({ boot }, defaultConfiguration);
    // Then
    expect(sut.options.boot).toBe(boot);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith({
      appName: sut.options.configuration.name,
      defaultConfiguration,
      options: {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      },
    });
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });
});
