const JimpleMock = require('/tests/mocks/jimple.mock');
const expressMock = require('/tests/mocks/express.mock');
const compressionMock = require('/tests/mocks/compression.mock');
const multerMock = require('/tests/mocks/multer.mock');
const bodyParserMock = require('/tests/mocks/bodyParser.mock');
const wootilsMock = require('/tests/mocks/wootils.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('express', () => expressMock);
jest.mock('compression', () => compressionMock);
jest.mock('multer', () => multerMock);
jest.mock('body-parser', () => bodyParserMock);
jest.mock('wootils/node/providers', () => wootilsMock);
jest.mock('/src/services/common', () => 'commonServices');
jest.mock('/src/services/http', () => 'httpServices');
jest.mock('/src/services/utils', () => 'utilsServices');
jest.unmock('/src/app/index');

const path = require('path');
require('jasmine-expect');

const Jimpex = require('/src/app');
const { EventsHub } = require('wootils/shared');

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
  });

  it('should throw an error if used without subclassing it', () => {
    // Given/When/Then
    expect(() => new Jimpex())
    .toThrow(/Jimpex is an abstract class/i);
  });

  it('should be able to be instantiated when subclassed', () => {
    // Given
    const bootMock = jest.fn();
    class Sut extends Jimpex {
      boot() {
        bootMock();
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
    let eventsService = null;
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
    sut = new Sut();
    // Then
    expect(sut).toBeInstanceOf(Sut);
    expect(sut).toBeInstanceOf(Jimpex);
    expect(bootMock).toHaveBeenCalledTimes(1);
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
    [, [, eventsService]] = sut.set.mock.calls;
    expect(eventsService()).toBeInstanceOf(EventsHub);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith(
      sut.options.configuration.name,
      defaultConfig,
      {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      }
    );
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', sut.options.statics.route);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('version');
  });

  it('should throw an error if `boot` is not overwritten', () => {
    // Given
    class Sut extends Jimpex {}
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
    // When/Then
    // eslint-disable-next-line no-new
    expect(() => new Sut()).toThrow(/This method must to be overwritten/i);
  });

  it('shouldn\'t call `boot` is the constructor flag is false', () => {
    // Given
    const bootMock = jest.fn();
    class Sut extends Jimpex {
      boot() {
        bootMock();
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
    new Sut(false);
    // Then
    expect(bootMock).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t set \'trust proxy\' if its flag is `false`', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
      express: {
        trustProxy: false,
      },
    });
    // Then
    expect(expressMock.mocks.enable).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t remove the \'x-powered-by\' if its flag is `false`', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
      express: {
        disableXPoweredBy: false,
      },
    });
    // Then
    expect(expressMock.mocks.disable).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the compression middleware if its flag is `false`', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
      express: {
        compression: false,
      },
    });
    // Then
    expect(compressionMock).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t add the bodyParser middleware if its flag is `false`', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
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
    new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
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
    let sut = null;
    // When
    sut = new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
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
    ];
    // When
    sut = new Sut(true, {
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
    sut = new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
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
    sut = new Sut(true, {
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
    class Sut extends Jimpex {
      boot() {}
    }
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
    sut = new Sut(true, {
      configuration: {
        hasFolder: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith(
      sut.options.configuration.name,
      defaultConfig,
      {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: sut.options.configuration.path,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      }
    );
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });

  it('should inject the app version on the default configuration', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
    sut = new Sut(true, {
      version,
      configuration: {
        hasFolder: false,
        loadVersionFromConfiguration: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith(
      sut.options.configuration.name,
      Object.assign({}, defaultConfig, { version }),
      {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: sut.options.configuration.path,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      }
    );
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
  });

  it('should receive the default configuration on the configuration options', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
    sut = new Sut(true, {
      configuration: {
        default: defaultConfiguration,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith(
      sut.options.configuration.name,
      defaultConfiguration,
      {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      }
    );
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(1);
    expect(sut.options.version).toBe(version);
  });

  it('shouldn\'t load the configuration based on an env var if the option is disabled', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
    sut = new Sut(true, {
      configuration: {
        default: defaultConfiguration,
        loadFromEnvironment: false,
      },
    });
    // Then
    expect(wootilsMock.appConfiguration).toHaveBeenCalledTimes(1);
    expect(wootilsMock.appConfiguration).toHaveBeenCalledWith(
      sut.options.configuration.name,
      defaultConfiguration,
      {
        environmentVariable: sut.options.configuration.environmentVariable,
        path: `${sut.options.configuration.path}${sut.options.configuration.name}/`,
        filenameFormat: `${sut.options.configuration.name}.[name].config.js`,
      }
    );
    expect(appConfiguration.loadFromEnvironment).toHaveBeenCalledTimes(0);
    expect(sut.options.version).toBe(version);
  });

  it('should disable TL validation', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
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
    const appLogger = {
      warning: jest.fn(),
    };
    JimpleMock.service('appLogger', appLogger);
    let sut = null;
    // When
    sut = new Sut();
    sut.disableTLSValidation();
    // Then
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0');
    expect(appLogger.warning).toHaveBeenCalledTimes(1);
    expect(appLogger.warning).toHaveBeenCalledWith('TLS validation has been disabled');
  });

  it('should start and stop the server', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
      'before-start',
      'start',
      'after-start',
      'after-start-callback',
      'before-stop',
      'after-stop',
    ];
    // When
    sut = new Sut();
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
      expect.any(Function)
    );
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(1);
  });

  it('should start the server and fire a custom callback', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    sut = new Sut();
    sut.start(callback);
    // Then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(appConfiguration);
  });

  it('should start the server using `listen`', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration.changes[prop] || configuration[prop]),
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
    sut = new Sut();
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
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration.changes[prop] || configuration[prop]),
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
    sut = new Sut();
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
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    sut = new Sut();
    sut.stop();
    // Then
    expect(expressMock.mocks.closeInstance).toHaveBeenCalledTimes(0);
  });

  it('should mount a controller', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    const routes = ['route-a', 'route-b'];
    const point = '/api';
    const controller = {
      connect: jest.fn(() => routes),
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
      ...routes.map((route) => [point, route]),
    ];
    // When
    sut = new Sut();
    sut.mount(point, controller);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('should mount a middleware', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    sut = new Sut();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('should mount an Express middleware', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    sut = new Sut();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedUseCalls.length);
    expectedUseCalls.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });

  it('shouldn\'t mount a middleware if its `connect` method returned a falsy value', () => {
    // Given
    class Sut extends Jimpex {
      boot() {}
    }
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
      get: jest.fn((prop) => configuration[prop]),
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
    sut = new Sut();
    sut.use(middleware);
    sut.start();
    // Then
    expect(expressMock.mocks.use).toHaveBeenCalledTimes(expectedMiddlewares.length);
    expectedMiddlewares.forEach((useCall) => {
      expect(expressMock.mocks.use).toHaveBeenCalledWith(...useCall);
    });
  });
});
