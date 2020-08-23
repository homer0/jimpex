jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/middlewares/common/errorHandler');

const { code: statuses } = require('statuses');
const {
  ErrorHandler,
  errorHandler,
} = require('../../../src/middlewares/common/errorHandler');

describe('middlewares/common:errorHandler', () => {
  it('should be instantiated with default options and have a middleware method', () => {
    // Given
    const appLogger = 'appLogger';
    const responsesBuilder = 'responsesBuilder';
    const showErrors = 'showErrors';
    const AppError = 'AppError';
    let sut = null;
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError);
    // Then
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(typeof sut.middleware).toBe('function');
    expect(sut.options).toEqual(({
      default: {
        message: 'Oops! Something went wrong, please try again',
        status: statuses['internal server error'],
      },
    }));
  });

  it('should be instantiated with custom options', () => {
    // Given
    const customOptions = {
      default: {
        message: 'Unknown error',
        status: statuses['service unavailable'],
      },
    };
    let sut = null;
    // When
    sut = new ErrorHandler(
      'appLogger',
      'responsesBuilder',
      'showErrors',
      'AppError',
      customOptions,
    );
    // Then
    expect(sut).toBeInstanceOf(ErrorHandler);
    expect(sut.options).toEqual(customOptions);
  });

  it('should return a middleware to format errors received by Express', () => {
    // Given
    const appLogger = 'appLogger';
    const responsesBuilder = {
      json: jest.fn(),
    };
    const showErrors = false;
    const AppError = Error;
    const error = new Error('The universe is low in battery');
    const request = 'request';
    const response = 'response';
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedData = {
      error: true,
      message: error.message,
    };
    const expectedStatus = statuses['bad request'];
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError);
    middleware = sut.middleware();
    middleware(error, request, response, next);
    // Then
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(
      response,
      expectedData,
      expectedStatus,
    );
  });

  it('shouldn\'t show the real error if it\'s not an instance of AppError', () => {
    // Given
    const appLogger = 'appLogger';
    const responsesBuilder = {
      json: jest.fn(),
    };
    const showErrors = false;
    const AppError = Error;
    const options = {
      default: {
        message: 'Unknown error',
      },
    };
    const error = {
      message: 'Some weird and unexpected error',
    };
    const request = 'request';
    const response = 'response';
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedData = {
      error: true,
      message: options.default.message,
    };
    const expectedStatus = statuses['internal server error'];
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError, options);
    middleware = sut.middleware();
    middleware(error, request, response, next);
    // Then
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(
      response,
      expectedData,
      expectedStatus,
    );
  });

  it('should show a full error information when `showErrors` is true', () => {
    // Given
    const appLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const showErrors = true;
    const AppError = Error;
    const errorStackMessage = 'error-stack';
    const error = {
      message: 'Some weird and unexpected error',
      stack: `Some weird and unexpected error
        ${errorStackMessage}`,
    };
    const request = 'request';
    const response = 'response';
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedData = {
      error: true,
      message: error.message,
      stack: [errorStackMessage],
    };
    const expectedStatus = statuses['internal server error'];
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError);
    middleware = sut.middleware();
    middleware(error, request, response, next);
    // Then
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(
      response,
      expectedData,
      expectedStatus,
    );
    expect(appLogger.error).toHaveBeenCalledTimes(1);
    expect(appLogger.error).toHaveBeenCalledWith(`ERROR: ${error.message}`);
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expectedData.stack);
  });

  it('should show context information the AppError object may contain', () => {
    // Given
    const appLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const showErrors = true;
    class AppError {
      constructor(message, stack, status, response) {
        this.message = message;
        this.status = status;
        this.response = response;
        this.stack = `${message}
          ${stack}`;
      }
    }
    const errorMessage = 'The invaders are already here';
    const errorStackMessage = 'error-stack';
    const errorStatus = 509;
    const errorResponse = {
      errorInfo: 'You are at your limit!',
    };
    const error = new AppError(
      errorMessage,
      errorStackMessage,
      errorStatus,
      errorResponse,
    );
    const request = 'request';
    const response = 'response';
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedData = {
      error: true,
      message: errorMessage,
      stack: [errorStackMessage],
      ...errorResponse,
    };
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError);
    middleware = sut.middleware();
    middleware(error, request, response, next);
    // Then
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(
      response,
      expectedData,
      errorStatus,
    );
    expect(appLogger.error).toHaveBeenCalledTimes(1);
    expect(appLogger.error).toHaveBeenCalledWith(`ERROR: ${error.message}`);
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expectedData.stack);
  });

  it('should move to the next middleware if there\'s no error', () => {
    // Given
    const appLogger = 'appLogger';
    const responsesBuilder = {
      json: jest.fn(),
    };
    const showErrors = false;
    const AppError = 'AppError';
    const error = null;
    const request = 'request';
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new ErrorHandler(appLogger, responsesBuilder, showErrors, AppError);
    middleware = sut.middleware();
    middleware(error, request, response, next);
    // Then
    expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should include a middleware shorthand to return its function', () => {
    // Given
    const appConfiguration = {
      'debug.showErrors': true,
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'appConfiguration',
      'appLogger',
      'responsesBuilder',
      'AppError',
    ];
    // When
    middleware = errorHandler.connect(app);
    toCompare = new ErrorHandler(
      'appLogger',
      'responsesBuilder',
      'showErrors',
      'AppError',
    );
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('debug.showErrors');
  });

  it('should include a middleware creator shorthand to modify its options', () => {
    // Given
    const appConfiguration = {
      'debug.showErrors': true,
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'appConfiguration',
      'appLogger',
      'responsesBuilder',
      'AppError',
    ];
    // When
    middleware = errorHandler().connect(app);
    toCompare = new ErrorHandler(
      'appLogger',
      'responsesBuilder',
      'showErrors',
      'AppError',
    );
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('debug.showErrors');
  });
});
