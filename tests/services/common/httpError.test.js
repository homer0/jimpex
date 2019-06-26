const statuses = require('statuses');

jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/common/appError');
jest.unmock('/src/services/common/httpError');

require('jasmine-expect');
const { AppError } = require('/src/services/common/appError');
const {
  HTTPError,
  httpError,
} = require('/src/services/common/httpError');

describe('services/common:httpError', () => {
  it('should be instantiated', () => {
    // Given
    const message = 'Something went wrong with a request!';
    let sut = null;
    // When
    sut = new HTTPError(message);
    // Then
    expect(sut).toBeInstanceOf(HTTPError);
    expect(sut).toBeInstanceOf(AppError);
    expect(sut).toBeInstanceOf(Error);
    expect(sut.message).toBe(message);
    expect(sut.status).toBe(statuses.ok);
    expect(sut.date).toBeInstanceOf(Date);
  });

  it('should be instantiated with a custom status', () => {
    // Given
    const message = 'Something went wrong with a request!';
    let sut = null;
    // When
    sut = new HTTPError(message, statuses.conflict);
    // Then
    expect(sut).toBeInstanceOf(HTTPError);
    expect(sut.message).toBe(message);
    expect(sut.status).toEqual(statuses.conflict);
  });

  it('should be instantiated with context information', () => {
    // Given
    const message = 'Something went wrong with a request!';
    const status = statuses['bad request'];
    const context = {
      age: 3,
      name: 'Rosario',
    };
    let sut = null;
    // When
    sut = new HTTPError(message, status, context);
    // Then
    expect(sut).toBeInstanceOf(HTTPError);
    expect(sut.message).toBe(message);
    expect(sut.status).toBe(status);
    expect(sut.context).toEqual(Object.assign({ status }, context));
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
      httpError.register(app);
      [[serviceName, serviceFn]] = app.set.mock.calls;
      sut = serviceFn();
      // Then
      expect(serviceName).toBe('HTTPError');
      expect(sut).toBe(HTTPError);
    });

    it('should register a shorthand generator', () => {
      // Given
      const app = {
        set: jest.fn(),
      };
      const message = 'Something went wrong with a request!';
      let sut = null;
      let serviceName = null;
      let serviceFn = null;
      let result = null;
      // When
      httpError.register(app);
      [, [serviceName, serviceFn]] = app.set.mock.calls;
      sut = serviceFn();
      result = sut(message, statuses.conflict);
      // Then
      expect(serviceName).toBe('httpError');
      expect(sut).toBeFunction();
      expect(result).toBeInstanceOf(HTTPError);
      expect(result.message).toBe(message);
      expect(result.status).toEqual(statuses.conflict);
    });
  });
});
