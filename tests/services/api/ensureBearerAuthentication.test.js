jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/api/ensureBearerAuthentication');

require('jasmine-expect');
const statuses = require('statuses');
const {
  EnsureBearerAuthentication,
  ensureBearerAuthentication,
} = require('/src/services/api/ensureBearerAuthentication');

describe('services/api:ensureBearerAuthentication', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const AppError = Error;
    let sut = null;
    // When
    sut = new EnsureBearerAuthentication(AppError);
    // Then
    expect(sut).toBeInstanceOf(EnsureBearerAuthentication);
    expect(sut.AppError).toBe(AppError);
  });

  it('should have a middleware to unauthorize requests without tokens', () => {
    // Given
    const token = 'abc';
    const request = {
      headers: {
        authorization: `bearer ${token}`,
      },
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new EnsureBearerAuthentication();
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(request.bearerToken).toBe(token);
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
    const request = {
      headers: {},
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new EnsureBearerAuthentication(AppError);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(appError).toHaveBeenCalledTimes(1);
    expect(appError).toHaveBeenCalledWith('Unauthorized', {
      status: statuses.Unauthorized,
    });
  });

  it('should send an error if the authorization header doesn\'t say `bearer`', () => {
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
    sut = new EnsureBearerAuthentication(AppError);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(appError).toHaveBeenCalledTimes(1);
    expect(appError).toHaveBeenCalledWith('Unauthorized', {
      status: statuses.Unauthorized,
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
    toCompare = new EnsureBearerAuthentication('AppError');
    ensureBearerAuthentication.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('ensureBearerAuthentication');
    expect(sut.toString()).toBe(toCompare.middleware().toString());
  });
});
