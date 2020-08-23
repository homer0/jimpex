jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/middlewares/utils/versionValidator');

require('jasmine-expect');
const { code: statuses } = require('statuses');
const {
  VersionValidator,
  versionValidator,
} = require('../../../src/middlewares/utils/versionValidator');

describe('services/api:versionValidator', () => {
  it('should be instantiated with its default options', () => {
    // Given
    const version = '1.0';
    const responsesBuilder = 'responsesBuilder';
    const AppError = 'AppError';
    let sut = null;
    // When
    sut = new VersionValidator(version, responsesBuilder, AppError);
    // Then
    expect(sut).toBeInstanceOf(VersionValidator);
    expect(sut.options).toEqual({
      error: 'The application version doesn\'t match',
      latest: {
        allow: true,
        name: 'latest',
      },
      popup: {
        variable: 'popup',
        title: 'Conflict',
        message: 'vesion:conflict',
      },
      version,
    });
  });

  it('should throw an error when instantiated without a version', () => {
    // Given
    const version = null;
    const responsesBuilder = 'responsesBuilder';
    const AppError = 'AppError';
    // When/Then
    expect(() => new VersionValidator(version, responsesBuilder, AppError))
    .toThrow(/You need to supply a version/i);
  });

  it('should be able to overwrite its default options', () => {
    // Given
    const version = '1.0';
    const responsesBuilder = 'responsesBuilder';
    const AppError = 'AppError';
    const options = {
      error: 'No way!',
      latest: {
        allow: false,
      },
      popup: {
        title: 'So much conflict!',
      },
      version: 'alpha.5',
    };
    let sut = null;
    // When
    sut = new VersionValidator(version, responsesBuilder, AppError, options);
    // Then
    expect(sut).toBeInstanceOf(VersionValidator);
    expect(sut.options).toEqual({
      error: options.error,
      latest: {
        allow: options.latest.allow,
        name: 'latest',
      },
      popup: {
        variable: 'popup',
        title: options.popup.title,
        message: 'vesion:conflict',
      },
      version: options.version,
    });
  });

  describe('middleware', () => {
    it('shouldn\'t do anything when no version is found in the route', () => {
      // Given
      const version = '0.1';
      const request = {
        params: {},
        query: {},
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version, 'responsesBuilder', 'AppError');
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow the current version', () => {
      // Given
      const version = '1.0';
      const request = {
        params: {
          version,
        },
        query: {},
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version);
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should generate an error when the version doesn\'t match', () => {
      // Given
      const version = '2.0';
      const options = {
        error: 'Missmatch!',
      };
      const appError = jest.fn();
      class AppError {
        constructor(...args) {
          appError(...args);
        }
      }
      const request = {
        params: {
          version: '3.0',
        },
        query: {},
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version, 'responsesBuilder', AppError, options);
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(appError).toHaveBeenCalledWith(
        options.error,
        {
          status: statuses.conflict,
          response: {
            validation: true,
          },
        },
      );
    });

    it('should allow \'latest\' as a version', () => {
      // Given
      const version = '1.0';
      const request = {
        params: {
          version: 'latest',
        },
        query: {},
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version);
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('shouldn\'t allow \'latest\' as a version', () => {
      // Given
      const version = '2.0';
      const options = {
        error: 'No latest!',
        latest: {
          allow: false,
        },
      };
      const appError = jest.fn();
      class AppError {
        constructor(...args) {
          appError(...args);
        }
      }
      const request = {
        params: {
          version: 'latest',
        },
        query: {},
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version, 'responsesBuilder', AppError, options);
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(appError).toHaveBeenCalledWith(
        options.error,
        {
          status: statuses.conflict,
          response: {
            validation: true,
          },
        },
      );
    });

    it('should send an HTML post message if the validation fails on a popup', () => {
      // Given
      const version = '2.0';
      const options = {
        popup: {
          variable: 'is-popup',
          title: 'MyPopUpConflict',
          message: 'version-conflict',
        },
      };
      const responsesBuilder = {
        htmlPostMessage: jest.fn(),
      };
      const appError = jest.fn();
      class AppError {
        constructor(...args) {
          appError(...args);
        }
      }
      const request = {
        params: {
          version: '25.09',
        },
        query: {
          [options.popup.variable]: 'true',
        },
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      // When
      sut = new VersionValidator(version, responsesBuilder, AppError, options);
      middleware = sut.middleware();
      middleware(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(0);
      expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledTimes(1);
      expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledWith(
        response,
        options.popup.title,
        options.popup.message,
        statuses.conflict,
      );
    });
  });

  describe('shorthand', () => {
    it('should generate the middleware function', () => {
      // Given
      const appConfiguration = {
        get: jest.fn(() => '25.09'),
      };
      const services = {
        appConfiguration,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
      };
      let sut = null;
      let toCompare = null;
      const expectedServices = [
        'appConfiguration',
        'responsesBuilder',
        'AppError',
      ];
      // When
      sut = versionValidator().connect(app);
      toCompare = new VersionValidator('25.09');
      // Then
      expect(sut.toString()).toEqual(toCompare.middleware().toString());
      expect(app.get).toHaveBeenCalledTimes(expectedServices.length);
      expectedServices.forEach((service) => {
        expect(app.get).toHaveBeenCalledWith(service);
      });
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith('version');
    });

    it('should generate a controller route', () => {
      // Given
      const appConfiguration = {
        get: jest.fn(() => '25.09'),
      };
      const router = {
        all: jest.fn(() => 'route'),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
      };
      let sut = null;
      let middleware = null;
      let toCompare = null;
      const expectedServices = [
        'appConfiguration',
        'responsesBuilder',
        'AppError',
        'router',
      ];
      // When
      sut = versionValidator.connect(app, '/route');
      ([[, middleware]] = router.all.mock.calls);
      toCompare = new VersionValidator('25.09');
      // Then
      expect(sut).toEqual(['route']);
      expect(middleware.toString()).toEqual(toCompare.middleware().toString());
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith('/:version/*', expect.any(Function));
      expect(app.get).toHaveBeenCalledTimes(expectedServices.length);
      expectedServices.forEach((service) => {
        expect(app.get).toHaveBeenCalledWith(service);
      });
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith('version');
    });
  });
});
