const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/middlewares/html/showHTML');

require('jasmine-expect');
const {
  ShowHTML,
  showHTMLCustom,
} = require('/src/middlewares/html/showHTML');

describe('middlewares/html:showHTML', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const sendFile = 'sendFile';
    let sut = null;
    // When
    sut = new ShowHTML(sendFile);
    // Then
    expect(sut).toBeInstanceOf(ShowHTML);
    expect(sut.sendFile).toBe(sendFile);
  });

  it('should be instantiated with the optional htmlGenerator service', () => {
    // Given
    const sendFile = 'sendFile';
    const file = 'random.html';
    const htmlGenerator = {
      getFile: jest.fn(() => file),
    };
    let sut = null;
    // When
    sut = new ShowHTML(sendFile, 'index.html', htmlGenerator);
    // Then
    expect(sut).toBeInstanceOf(ShowHTML);
    expect(sut.sendFile).toBe(sendFile);
    expect(sut.htmlGenerator).toBe(htmlGenerator);
    expect(sut.file).toBe(file);
    expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
  });

  it('should return a middleware to send an specific html file', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'charito.html';
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new ShowHTML(sendFile, file);
    middleware = sut.middleware();
    middleware(request, response, next);
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file, next);
  });

  it(
    'should show the file created by the htmlGenerator service',
    () => new Promise((resolve) => {
      // Given
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'charito.html';
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.resolve()),
      };
      const request = 'request';
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new ShowHTML(sendFile, '', htmlGenerator);
      middleware = sut.middleware();
      middleware(request, response, () => {
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith(response, file, expect.any(Function));
        resolve();
      });
    })
    .catch(() => {
      expect(true).toBeFalse();
    })
  );

  it(
    'should fail to show the file created by the htmlGenerator service',
    () => new Promise((resolve) => {
      // Given
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'charito.html';
      const error = new Error('Unknown error');
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.reject(error)),
      };
      const request = {
        originalUrl: '/some/path',
      };
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new ShowHTML(sendFile, '', htmlGenerator);
      middleware = sut.middleware();
      middleware(request, response, (result) => {
        expect(result).toBe(error);
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledTimes(0);
        resolve();
      });
    })
    .catch(() => {
      expect(true).toBeFalse();
    })
  );

  it('should include a middleware shorthand to return its function', () => {
    // Given
    const services = {};
    const app = {
      get: jest.fn((service) => {
        if (service === 'htmlGenerator') {
          throw Error();
        }

        return services[service] || service;
      }),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'htmlGenerator',
      'sendFile',
    ];
    // When
    middleware = showHTMLCustom().connect(app);
    toCompare = new ShowHTML();
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
