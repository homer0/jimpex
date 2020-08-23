jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/services/common/appError');

const { code: statuses } = require('statuses');
const {
  AppError,
  appError,
} = require('../../../src/services/common/appError');

const originalCaptureStackTrace = Error.captureStackTrace;

describe('services/common:appError', () => {
  afterEach(() => {
    Error.captureStackTrace = originalCaptureStackTrace;
  });

  it('should be instantiated', () => {
    // Given
    const message = 'Something went wrong!';
    let sut = null;
    // When
    sut = new AppError(message);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut).toBeInstanceOf(Error);
    expect(sut.message).toBe(message);
    expect(sut.date).toBeInstanceOf(Date);
    expect(sut.response).toEqual({});
    expect(sut.status).toBeNull();
  });

  it('should be instantiated with context information', () => {
    // Given
    const message = 'Something went wrong!';
    const context = {
      age: 3,
      name: 'Rosario',
      response: 'Something in case a response needs to be generated',
      status: 500,
    };
    let sut = null;
    // When
    sut = new AppError(message, context);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.message).toBe(message);
    expect(sut.context).toEqual(context);
    expect(sut.response).toEqual(context.response);
    expect(sut.status).toEqual(context.status);
  });

  it('should format a status code sent as string', () => {
    // Given
    const message = 'Something went wrong!';
    const context = {
      status: 'internal server error',
    };
    let sut = null;
    // When
    sut = new AppError(message, context);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.status).toBe(statuses[context.status]);
  });

  it('shouldn\'t format a status code sent as string if is not a valid status', () => {
    // Given
    const message = 'Something went wrong!';
    const context = {
      status: 'wooo',
    };
    let sut = null;
    // When
    sut = new AppError(message, context);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.status).toBe(context.status);
  });

  it('should use `captureStackTrace` when avaiable', () => {
    // Given
    const captureStackTrace = jest.fn();
    Error.captureStackTrace = captureStackTrace;
    let sut = null;
    // When
    sut = new AppError('With stack trace');
    Error.captureStackTrace = null;
    // eslint-disable-next-line no-new
    new AppError('Without stack trace');
    // Then
    expect(captureStackTrace).toHaveBeenCalledTimes(1);
    expect(captureStackTrace).toHaveBeenCalledWith(sut, sut.constructor);
  });

  describe('DIC provider', () => {
    it('should register the class as a service', () => {
      // Given
      const app = {
        set: jest.fn(),
      };
      let sut = null;
      let serviceName = null;
      let serviceFn = null;
      // When
      appError.register(app);
      [[serviceName, serviceFn]] = app.set.mock.calls;
      sut = serviceFn();
      // Then
      expect(serviceName).toBe('AppError');
      expect(sut).toBe(AppError);
    });

    it('should register a shorthand generator', () => {
      // Given
      const app = {
        set: jest.fn(),
      };
      const message = 'Something went wrong!';
      const context = {
        name: 'Charo',
      };
      let sut = null;
      let serviceName = null;
      let serviceFn = null;
      let result = null;
      // When
      appError.register(app);
      [, [serviceName, serviceFn]] = app.set.mock.calls;
      sut = serviceFn();
      result = sut(message, context);
      // Then
      expect(serviceName).toBe('appError');
      expect(typeof sut).toBe('function');
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe(message);
      expect(result.context).toEqual(context);
    });
  });
});
