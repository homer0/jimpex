const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/controllers/common/rootStatics');

require('jasmine-expect');
const {
  RootStaticsController,
  rootStaticsControllerCustom,
} = require('/src/controllers/common/rootStatics');

describe('controllers/common:rootStatics', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const sendFile = 'sendFile';
    let sut = null;
    // When
    sut = new RootStaticsController(sendFile);
    // Then
    expect(sut).toBeInstanceOf(RootStaticsController);
    expect(sut.sendFile).toBe(sendFile);
  });

  it('should have a method to return all the files it will serve', () => {
    // Given
    const sendFile = 'sendFile';
    const files = ['index.png', 'index.html'];
    let sut = null;
    let result = null;
    // When
    sut = new RootStaticsController(sendFile, files);
    result = sut.getFileEntries();
    // Then
    expect(result).toEqual(files);
  });

  it('should have a middleware to serve the files sent on the constructor', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'index.html';
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new RootStaticsController(sendFile, [file]);
    middleware = sut.serveFile(file);
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file, next);
  });

  it('should be able to serve a static file on a route different from where it is', () => {
    // Given
    const sendFile = jest.fn();
    const file = {
      origin: 'favicon.png',
      output: 'some/folder.png',
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new RootStaticsController(sendFile, [file]);
    middleware = sut.serveFile(file.origin);
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file.output, next);
  });

  it('should be able to serve a static file with custom headers', () => {
    // Given
    const sendFile = jest.fn();
    const customHeaderName = 'x-custom-header';
    const customHeaderValue = 'magic!';
    const file = {
      origin: 'favicon.png',
      output: 'some/folder.png',
      headers: {
        [customHeaderName]: customHeaderValue,
      },
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedHeaders = [
      [customHeaderName, customHeaderValue],
      ['Content-Type', 'image/png'],
    ];
    // When
    sut = new RootStaticsController(sendFile, [file]);
    middleware = sut.serveFile(file.origin);
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(expectedHeaders.length);
    expectedHeaders.forEach((setHeaderCall) => {
      expect(response.setHeader).toHaveBeenCalledWith(...setHeaderCall);
    });
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file.output, next);
  });

  it('should throw an error when trying to serve an unknown file', () => {
    // Given
    const sendFile = 'sendFile';
    const files = ['fileA', 'fileC'];
    let sut = null;
    // When
    sut = new RootStaticsController(sendFile, files);
    // Then
    expect(() => sut.serveFile('fileB')).toThrow(/The required static file doesn't exist/i);
  });

  it('should include a controller shorthand to return its routes', () => {
    // Given
    const file = 'index.html';
    const services = {
      router: {
        all: jest.fn((route, middleware) => [`all:${route}`, middleware.toString()]),
      },
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let routes = null;
    let toCompare = null;
    const expectedGets = ['router', 'sendFile'];
    // When
    routes = rootStaticsControllerCustom([file]).connect(app);
    toCompare = new RootStaticsController('sendFile', [file]);
    // Then
    expect(routes).toEqual([
      [`all:/${file}`, toCompare.serveFile(file).toString()],
    ]);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
