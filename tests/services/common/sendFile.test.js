jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/common/sendFile');

require('jasmine-expect');
const {
  sendFile,
  sendFileProvider,
} = require('/src/services/common/sendFile');

describe('services/common:sendFile', () => {
  it('should create a function to send a file on a server response', () => {
    // Given
    const pathUtils = 'pathUtils';
    let sut = null;
    // When
    sut = sendFile(pathUtils);
    // Then
    expect(sut).toBeFunction();
  });

  it('should send a file on a server response', () => {
    // Given
    const file = 'index.html';
    const pathUtils = {
      joinFrom: jest.fn((from, filepath) => filepath),
    };
    const response = {
      sendFile: jest.fn((filepath, callback) => callback()),
      end: jest.fn(),
    };
    // When
    sendFile(pathUtils)(response, file);
    // Then
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', file);
    expect(response.sendFile).toHaveBeenCalledTimes(1);
    expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('should send a file on a server response, with a custom location', () => {
    // Given
    const file = 'index.html';
    const pathUtils = {
      joinFrom: jest.fn((from, filepath) => filepath),
    };
    const response = {
      sendFile: jest.fn((filepath, callback) => callback()),
      end: jest.fn(),
    };
    const location = 'home';
    // When
    sendFile(pathUtils)(response, file, null, location);
    // Then
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith(location, file);
    expect(response.sendFile).toHaveBeenCalledTimes(1);
    expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('should send an error if the response fails while sending a file', () => {
    // Given
    const error = new Error('Unknown error');
    const file = 'index.html';
    const pathUtils = {
      joinFrom: jest.fn((from, filepath) => filepath),
    };
    const response = {
      sendFile: jest.fn((filepath, callback) => callback(error)),
      end: jest.fn(),
    };
    const next = jest.fn();
    // When
    sendFile(pathUtils)(response, file, next);
    // Then
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', file);
    expect(response.sendFile).toHaveBeenCalledTimes(1);
    expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(response.end).toHaveBeenCalledTimes(0);
  });

  it('should fail silently if the response fails to send the file and `next` is not sent', () => {
    // Given
    const file = 'index.html';
    const pathUtils = {
      joinFrom: jest.fn((from, filepath) => filepath),
    };
    const response = {
      sendFile: jest.fn((filepath, callback) => callback(true)),
      end: jest.fn(),
    };
    // When
    sendFile(pathUtils)(response, file);
    // Then
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', file);
    expect(response.sendFile).toHaveBeenCalledTimes(1);
    expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
    expect(response.end).toHaveBeenCalledTimes(0);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const app = {
      get: jest.fn(),
      set: jest.fn(),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    sendFileProvider.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('sendFile');
    expect(sut.toString()).toBe(sendFile().toString());
  });
});
