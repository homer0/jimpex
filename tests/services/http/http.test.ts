jest.mock('node-fetch');
jest.unmock('@src/services/http/http');

import originalNodeFetch from 'node-fetch';
import { HTTP, httpProvider, HTTPContructorOptions } from '@src/services/http/http';
import { getJimpexMock, getLoggerMock } from '@tests/mocks';
import type { Request, HTTPResponse } from '@src/types';

type FetchType = typeof originalNodeFetch;
const fetch = originalNodeFetch as unknown as jest.MockInstance<
  ReturnType<FetchType>,
  jest.ArgsType<FetchType>
>;

describe('services/http:http', () => {
  describe('class', () => {
    beforeEach(() => {
      fetch.mockClear();
    });

    it('should be instantiated', () => {
      // Given
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      // Then
      expect(sut).toBeInstanceOf(HTTP);
      expect(sut.getOptions()).toEqual({
        logRequests: false,
      });
    });

    it('should get a request IP', () => {
      // Given
      const ip = '25.09.2015';
      const cases = {
        requestWithHeader: {
          headers: {
            'x-forwarded-for': ip,
          },
        },
        requestWithConnectionRemoteAddr: {
          headers: {},
          connection: {
            remoteAddress: ip,
          },
        },
        requestWithSocketRemoteAddr: {
          headers: {},
          connection: {},
          socket: {
            remoteAddress: ip,
          },
        },
        requestWithConnectionSocketRemoteAddr: {
          headers: {},
          socket: {},
          connection: {
            socket: {
              remoteAddress: ip,
            },
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
      const casesNames = Object.keys(cases);
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const results = casesNames.map((caseName) => {
        const req = cases[caseName as keyof typeof cases] as unknown as Request;
        return sut.getIPFromRequest(req);
      }, {});
      const invalidResult = sut.getIPFromRequest(requestWithNoIP as unknown as Request);
      // Then
      expect(results).toEqual(new Array(casesNames.length).fill(ip));
      expect(invalidResult).toBeUndefined();
    });

    it('should return all custom headers from a request', () => {
      // Given
      const customForwardedHeaders = {
        'x-forwarded-for': '25.09.2015',
        'x-forwarded-proto': 'https',
      };
      const customHeaders = {
        'x-custom-header-1': 'custom-value-1',
        'x-custom-header-2': 'custom-value-2',
      };
      const headers = {
        ...customForwardedHeaders,
        ...customHeaders,
        'content-type': 'application/json',
        authorization: 'Bearer 123',
      };
      const req = {
        headers,
      } as unknown as Request;
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const resultWithForwardedHeaders = sut.getCustomHeadersFromRequest(req, {
        includeXForwardedHeaders: true,
      });
      const resultWithoutForwardedHeaders = sut.getCustomHeadersFromRequest(req);
      // Then
      expect(resultWithForwardedHeaders).toEqual({
        ...customHeaders,
        ...customForwardedHeaders,
      });
      expect(resultWithoutForwardedHeaders).toEqual(customHeaders);
    });

    it('should make a request', async () => {
      // Given
      const url = 'https://example.com';
      const response = 'Hello World' as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url);
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
      });
    });

    it('should make a request with a query string object', async () => {
      // Given
      const url = 'https://example.com/index.html';
      const response = 'Hello World' as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const qsVariable = 'sort';
      const qsValue = 'date';
      const qs = {
        [qsVariable]: qsValue,
      };
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url, { qs });
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${url}?${qsVariable}=${qsValue}`, {
        method: 'GET',
      });
    });

    it('should make a request with a body', async () => {
      // Given
      const url = 'https://example.com';
      const method = 'POST';
      const body = {
        bodyProp: 'bodyValue',
      };
      const response = 'Hello World' as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url, {
        method,
        body,
      });
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method,
        body,
      });
    });

    it('should make a request and forward custom headers', async () => {
      // Given
      const url = 'https://example.com';
      const response = 'Hello World' as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const request = {
        headers: {
          'x-date': '25.09.2015',
          'x-custom-header': 'some-custom-value',
        },
      } as unknown as Request;
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url, { req: request });
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: {
          'X-Date': request.headers['x-date'],
          'X-Custom-Header': request.headers['x-custom-header'],
        },
      });
    });

    it('should make a request and forward the IP', async () => {
      // Given
      const url = 'https://example.com';
      const response = 'Hello World' as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const ip = '25.09.2015';
      const request = {
        headers: {},
        connection: {
          socket: {
            remoteAddress: ip,
          },
        },
      } as unknown as Request;
      const { logger } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url, { req: request });
      // Then
      expect(result).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: {
          'X-Forwarded-For': ip,
        },
      });
    });

    it('should make a request and log it', async () => {
      // Given
      const url = 'https://example.com';
      const status = 200;
      const response = {
        url,
        data: 'hello world',
        headers: [],
        status,
      } as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const { logger, loggerMocks } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
        logRequests: true,
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url);
      // Then
      expect(result).toBe(response);
      expect(loggerMocks.info).toHaveBeenCalledTimes(2);
      expect(loggerMocks.info).toHaveBeenNthCalledWith(1, [
        '--->>',
        `REQUEST> GET ${url}`,
      ]);
      expect(loggerMocks.info).toHaveBeenNthCalledWith(2, [
        '<<---',
        `RESPONSE> ${url}`,
        `RESPONSE> status: ${status}`,
      ]);
    });

    it('should make a request with custom headers and log them', async () => {
      // Given
      const url = 'https://example.com';
      const method = 'POST';
      const body = 'body';
      const request = {
        headers: {
          'x-custom-header': 'some-custom-value',
          'x-forwarded-for': '25.09.2015',
        },
      } as unknown as Request;
      const status = 200;
      // The headers object is actually a custom iterable
      const responseHeaders = ['custom-header-value', 'another-custom-header-value'];
      const response = {
        url,
        data: 'hello world',
        headers: responseHeaders,
        status,
      } as unknown as HTTPResponse;
      fetch.mockResolvedValueOnce(response);
      const headersFixedNames = {
        'x-custom-header': 'X-Custom-Header',
        'x-forwarded-for': 'X-Forwarded-For',
      };
      const { logger, loggerMocks } = getLoggerMock();
      const options: HTTPContructorOptions = {
        inject: {
          logger,
        },
        logRequests: true,
      };
      // When
      const sut = new HTTP(options);
      const result = await sut.fetch(url, { method, body, req: request });
      // Then
      expect(result).toBe(response);
      expect(loggerMocks.info).toHaveBeenCalledTimes(2);
      expect(loggerMocks.info).toHaveBeenNthCalledWith(1, [
        '--->>',
        `REQUEST> ${method} ${url}`,
        ...Object.keys(request.headers).map(
          (headerName) =>
            `REQUEST> ${
              headersFixedNames[headerName as keyof typeof headersFixedNames]
            }: ${request.headers[headerName]}`,
        ),
        `REQUEST> body: "${body}"`,
      ]);
      expect(loggerMocks.info).toHaveBeenNthCalledWith(2, [
        '<<---',
        `RESPONSE> ${url}`,
        `RESPONSE> status: ${status}`,
        ...responseHeaders.map((value, index) => `RESPONSE> ${index}: ${value}`),
      ]);
    });
  });

  describe('provider', () => {
    it('should register the service', () => {
      // Given
      const config = {
        get: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      httpProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => HTTP]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(HTTP);
      expect(result.getOptions().logRequests).toBe(false);
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('http', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(2);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'logger');
    });

    it('should register the service and enable logging', () => {
      // Given
      const config = {
        get: jest.fn(() => true),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      httpProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => HTTP]];
      const result = lazy();
      // Then
      expect(result.getOptions().logRequests).toBe(true);
    });
  });
});
