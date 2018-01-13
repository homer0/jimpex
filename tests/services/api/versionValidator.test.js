const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/api/versionValidator');

require('jasmine-expect');
const statuses = require('statuses');
const {
  VersionValidator,
  versionValidator,
} = require('/src/services/api/versionValidator');

describe('services/api:versionValidator', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const appConfiguration = 'appConfiguration';
    const responsesBuilder = 'responsesBuilder';
    const AppError = 'AppError';
    let sut = null;
    // When
    sut = new VersionValidator(appConfiguration, responsesBuilder, AppError);
    // Then
    expect(sut).toBeInstanceOf(VersionValidator);
    expect(sut.appConfiguration).toBe(appConfiguration);
    expect(sut.responsesBuilder).toBe(responsesBuilder);
    expect(sut.AppError).toBe(AppError);
  });

  it('should have a middleware to validate a version on the route', () => {
    // Given
    const version = 'latest';
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
    sut = new VersionValidator('appConfiguration', 'responsesBuilder', 'AppError');
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should validate if the version is the same as the one on the configuration', () => {
    // Given
    const version = '25092015';
    const appConfiguration = {
      get: jest.fn(() => version),
    };
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
    sut = new VersionValidator(appConfiguration, 'responsesBuilder', 'AppError');
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should send an error if the version is not valid', () => {
    // Given
    const appError = jest.fn();
    class AppError {
      constructor(...args) {
        appError(...args);
      }
    }
    const version = '25092015';
    const appConfiguration = {
      get: jest.fn(),
    };
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
    sut = new VersionValidator(appConfiguration, 'responsesBuilder', AppError);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(appError).toHaveBeenCalledTimes(1);
    expect(appError).toHaveBeenCalledWith(
      'The API version and the client version are different',
      {
        status: statuses.conflict,
        response: {
          api: true,
        },
      }
    );
  });

  it('should send an HTML post message if the version is the route identifies as a popup', () => {
    // Given
    const version = '25092015';
    const appConfiguration = {
      get: jest.fn(),
    };
    const responsesBuilder = {
      htmlPostMessage: jest.fn(),
    };
    const request = {
      params: {
        version,
      },
      query: {
        popup: 'true',
      },
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new VersionValidator(appConfiguration, responsesBuilder, 'AppError');
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(0);
    expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledWith(
      response,
      'Conflict',
      'api:conflict',
      statuses.conflict
    );
  });

  it('should include a provider for the DIC', () => {
    // Given
    const services = {};
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (services[service] || service)),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    let toCompare = null;
    // When
    toCompare = new VersionValidator(
      'appConfiguration',
      'responsesBuilder',
      'AppError'
    );
    versionValidator(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('versionValidator');
    expect(sut.toString()).toBe(toCompare.middleware().toString());
  });
});
