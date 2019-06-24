jest.mock('node-fetch');
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/http/http');

require('jasmine-expect');
const fetch = require('node-fetch');
const {
  HTTP,
  http,
} = require('/src/services/http/http');

describe('services/http:http', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('should be instantiated', () => {
    // Given
    const logRequests = 'logRequests';
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    // Then
    expect(sut).toBeInstanceOf(HTTP);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const appConfiguration = {
      get: jest.fn(),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (services[service] || service)),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    http.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('http');
    expect(sut).toBeInstanceOf(HTTP);
    expect(sut.logRequests).toBeFalse();
  });

  it('should get a request IP from an Express request object', () => {
    // Given
    const ip = '25.09.2015';
    const requestWithHeader = {
      headers: {
        'x-forwarded-for': ip,
      },
    };
    const requestWithConnectionRemoteAddr = {
      headers: {},
      connection: {
        remoteAddress: ip,
      },
    };
    const requestWithSocketRemoteAddr = {
      headers: {},
      connection: {},
      socket: {
        remoteAddress: ip,
      },
    };
    const requestWithConnectionSocketRemoteAddr = {
      headers: {},
      socket: {},
      connection: {
        socket: {
          remoteAddress: ip,
        },
      },
    };
    const requestWithNoIP = {
      headers: {},
      connection: {
        socket: {},
      },
      socket: {},
    };
    const logRequests = 'logRequests';
    const appLogger = 'appLogger';
    let sut = null;
    let resultForHeader = null;
    let resultForConnection = null;
    let resultForSocket = null;
    let resultForConnectionSocket = null;
    let resultForEmptyRequest = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    resultForHeader = sut.getIPFromRequest(requestWithHeader);
    resultForConnection = sut.getIPFromRequest(requestWithConnectionRemoteAddr);
    resultForSocket = sut.getIPFromRequest(requestWithSocketRemoteAddr);
    resultForConnectionSocket = sut.getIPFromRequest(requestWithConnectionSocketRemoteAddr);
    resultForEmptyRequest = sut.getIPFromRequest(requestWithNoIP);
    // Then
    expect(resultForHeader).toBe(ip);
    expect(resultForConnection).toBe(ip);
    expect(resultForSocket).toBe(ip);
    expect(resultForConnectionSocket).toBe(ip);
    expect(resultForEmptyRequest).toBeUndefined();
  });

  it('should return all the custom headers from a request, except for `x-forwarded-for`', () => {
    // Given
    const customHeaderName = 'x-custom-header';
    const customHeaderValue = 'some-custom-value';
    const request = {
      headers: {
        'x-forwarded-for': '25.09.2015',
        [customHeaderName]: customHeaderValue,
      },
    };
    const logRequests = 'logRequests';
    const appLogger = 'appLogger';
    let sut = null;
    let result = null;
    const expectedResult = {
      [customHeaderName]: customHeaderValue,
    };
    // When
    sut = new HTTP(logRequests, appLogger);
    result = sut.getCustomHeadersFromRequest(request);
    // Then
    expect(result).toEqual(expectedResult);
  });

  it('should make a fetch request', () => {
    // Given
    const url = 'http://charito';
    const response = 'Hello!';
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = false;
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url)
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
      });
    });
  });

  it('should make a fetch request with a custom method', () => {
    // Given
    const url = 'http://charito';
    const response = 'Hello!';
    const method = 'POST';
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = false;
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url, { method })
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, { method });
    });
  });

  it('should make a fetch request with a query string object', () => {
    // Given
    const url = 'http://charito/index.html';
    const qsVariable = 'sort';
    const qsValue = 'date';
    const qs = {
      [qsVariable]: qsValue,
    };
    const response = 'Hello!';
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = false;
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url, { qs })
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${url}?${qsVariable}=${qsValue}`, {
        method: 'GET',
      });
    });
  });

  it('should make a fetch request with a body', () => {
    // Given
    const url = 'http://charito';
    const method = 'POST';
    const body = {
      bodyProp: 'bodyValue',
    };
    const response = 'Hello!';
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = false;
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url, { method, body })
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method,
        body,
      });
    });
  });

  it('should make a fetch request with the headers from an incoming server request', () => {
    // Given
    const url = 'http://charito';
    const response = 'Hello!';
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const request = {
      headers: {
        'x-forwarded-for': '25.09.2015',
        'x-custom-header': 'some-custom-value',
      },
    };
    const logRequests = false;
    const appLogger = 'appLogger';
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url, { req: request })
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: {
          'X-Forwarded-For': request.headers['x-forwarded-for'],
          'X-Custom-Header': request.headers['x-custom-header'],
        },
      });
    });
  });

  it('should make a fetch request and log it', () => {
    // Given
    const url = 'http://charito';
    const response = {
      url,
      status: 200,
      headers: [],
    };
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = true;
    const appLogger = {
      info: jest.fn(),
    };
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url)
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
      });
      expect(appLogger.info).toHaveBeenCalledTimes(['request', 'response'].length);
      expect(appLogger.info).toHaveBeenCalledWith([
        '--->>',
        `REQUEST> GET ${url}`,
      ]);
      expect(appLogger.info).toHaveBeenCalledWith([
        '<<---',
        `RESPONSE> ${url}`,
        `RESPONSE> status: ${response.status}`,
      ]);
    });
  });

  it('should make a fetch request with custom header, body and log it', () => {
    // Given
    const url = 'http://charito';
    const method = 'POST';
    const body = 'body';
    const request = {
      headers: {
        'x-forwarded-for': '25.09.2015',
        'x-custom-header': 'some-custom-value',
      },
    };
    const response = {
      url,
      status: 200,
      // The headers object is actually a custom iterable
      headers: ['custom-header-value', 'another-custom-header-value'],
    };
    const headersFixedNames = {
      'x-forwarded-for': 'X-Forwarded-For',
      'x-custom-header': 'X-Custom-Header',
    };
    fetch.mockImplementationOnce(() => Promise.resolve(response));
    const logRequests = true;
    const appLogger = {
      info: jest.fn(),
    };
    let sut = null;
    // When
    sut = new HTTP(logRequests, appLogger);
    return sut.fetch(url, { method, body, req: request })
    .then((result) => {
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method,
        body,
        headers: Object.keys(request.headers).reduce(
          (newHeaders, name) => Object.assign({}, newHeaders, {
            [headersFixedNames[name]]: request.headers[name],
          }),
          {}
        ),
      });
      expect(appLogger.info).toHaveBeenCalledTimes(['request', 'response'].length);
      expect(appLogger.info).toHaveBeenCalledWith([
        '--->>',
        `REQUEST> ${method} ${url}`,
        ...Object.keys(request.headers)
        .map((headerName) => (
          `REQUEST> ${headersFixedNames[headerName]}: ` +
            `${request.headers[headerName]}`
        )),
        `REQUEST> body: "${body}"`,
      ]);
      expect(appLogger.info).toHaveBeenCalledWith([
        '<<---',
        `RESPONSE> ${url}`,
        `RESPONSE> status: ${response.status}`,
        ...response.headers.map((value, index) => `RESPONSE> ${index}: ${value}`),
      ]);
    });
  });

  it('should turn on the requests log when registered if the configuration flag is `true`', () => {
    // Given
    const appConfiguration = {
      'debug.logRequests': true,
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (services[service] || service)),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    http.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('http');
    expect(sut).toBeInstanceOf(HTTP);
    expect(sut.logRequests).toBeTrue();
  });
});
