jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/services/utils/ensureBearerToken');

const { code: statuses } = require('statuses');
const {
  EnsureBearerToken,
  ensureBearerToken,
} = require('../../../src/services/utils/ensureBearerToken');

describe('services/utils:ensureBearerToken', () => {
  it('should be instantiated with its default options', () => {
    // Given
    const AppError = Error;
    let sut = null;
    // When
    sut = new EnsureBearerToken(AppError);
    // Then
    expect(sut).toBeInstanceOf(EnsureBearerToken);
    expect(sut.options).toEqual({
      expression: /bearer (.*?)(?:$|\s)/i,
      local: 'token',
      error: {
        message: 'Unauthorized',
        status: statuses.unauthorized,
        response: {},
      },
    });
  });

  it('should be instantiated with custom options', () => {
    // Given
    const AppError = Error;
    const options = {
      local: 'myToken',
      error: {
        message: 'Nop!',
      },
    };
    let sut = null;
    // When
    sut = new EnsureBearerToken(AppError, options);
    // Then
    expect(sut).toBeInstanceOf(EnsureBearerToken);
    expect(sut.options).toEqual({
      expression: /bearer (.*?)(?:$|\s)/i,
      local: options.local,
      error: {
        message: options.error.message,
        status: statuses.unauthorized,
        response: {},
      },
    });
  });

  it('should have a middleware to authorize requests with tokens', () => {
    // Given
    const token = 'abc';
    const request = {
      headers: {
        authorization: `bearer ${token}`,
      },
    };
    const response = { locals: {} };
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new EnsureBearerToken();
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(response.locals.token).toBe(token);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should send an error when the token is not present on the request', () => {
    // Given
    const appError = jest.fn();
    class AppError {
      constructor(...args) {
        appError(...args);
      }
    }
    const options = {
      error: {
        message: 'Nop',
        status: statuses['bad request'],
        response: { unauthorized: true },
      },
    };
    const request = {
      headers: {},
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new EnsureBearerToken(AppError, options);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(appError).toHaveBeenCalledTimes(1);
    expect(appError).toHaveBeenCalledWith(options.error.message, {
      status: options.error.status,
      response: options.error.response,
    });
  });

  it('should send an error if the authorization header doesn\'t match the expression', () => {
    // Given
    const appError = jest.fn();
    class AppError {
      constructor(...args) {
        appError(...args);
      }
    }
    const request = {
      headers: {
        authorization: 'something',
      },
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new EnsureBearerToken(AppError);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(appError).toHaveBeenCalledTimes(1);
    expect(appError).toHaveBeenCalledWith('Unauthorized', {
      status: statuses.unauthorized,
      response: {},
    });
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
    toCompare = new EnsureBearerToken('AppError');
    ensureBearerToken.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('ensureBearerToken');
    expect(sut.toString()).toBe(toCompare.middleware().toString());
  });

  it('should include a provider creator for the DIC', () => {
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
    toCompare = new EnsureBearerToken('AppError');
    ensureBearerToken().register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('ensureBearerToken');
    expect(sut.toString()).toBe(toCompare.middleware().toString());
  });
});
