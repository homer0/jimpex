const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/common/error');

require('jasmine-expect');
const {
  AppError,
  appError,
} = require('/src/services/common/error');

describe('services/common:error', () => {
  it('should be instantiated', () => {
    // Given
    const message = 'Something went wrong!';
    let sut = null;
    // When
    sut = new AppError(message);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.message).toBe(message);
  });

  it('should be instantiated with custom properties', () => {
    // Given
    const message = 'Something went wrong!';
    const customProperties = {
      status: 500,
      api: true,
    };
    let sut = null;
    // When
    sut = new AppError(message, customProperties);
    // Then
    expect(sut).toBeInstanceOf(AppError);
    expect(sut.message).toBe(message);
    expect(sut.extras).toEqual(customProperties);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const app = {
      set: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    appError(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('appError');
    expect(sut).toBe(AppError);
  });
});
