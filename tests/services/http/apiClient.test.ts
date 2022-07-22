jest.mock('node-fetch');
jest.unmock('@src/services/common/appError');
jest.unmock('@src/services/common/httpError');
jest.unmock('@src/services/http/apiClient');

import {
  APIClient,
  apiClientProvider,
  type APIClientConstructorOptions,
  type ErrorResponse,
} from '@src/services/http/apiClient';
import { HTTPError } from '@src/services/common/httpError';
import type { HTTP } from '@src/services/http/http';
import { getJimpexMock } from '@tests/mocks';

describe('services/html:apiClient', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const http = {
        fetch: jest.fn(),
      } as unknown as HTTP;
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const options: APIClientConstructorOptions = {
        inject: {
          http,
          HTTPError,
        },
        ...apiConfig,
      };
      // When
      const sut = new APIClient(options);
      // Then
      expect(sut).toBeInstanceOf(APIClient);
      expect(sut.getConfig()).toEqual(apiConfig);
    });

    it('should be instantiated using `gateway`', () => {
      // Given
      const http = {
        fetch: jest.fn(),
      } as unknown as HTTP;
      const url = 'my-api';
      const endpoints = {
        info: 'api-info',
      };
      const apiConfig = {
        url,
        gateway: endpoints,
      };
      const options: APIClientConstructorOptions = {
        inject: {
          http,
          HTTPError,
        },
        ...apiConfig,
      };
      // When
      const sut = new APIClient(options);
      // Then
      expect(sut).toBeInstanceOf(APIClient);
      expect(sut.getConfig()).toEqual({
        url,
        endpoints,
      });
    });

    it('should format error messages', () => {
      // Given
      const http = {
        fetch: jest.fn(),
      } as unknown as HTTP;
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const options: APIClientConstructorOptions = {
        inject: {
          http,
          HTTPError,
        },
        ...apiConfig,
      };
      const errorStatus = 400;
      const errorMessage = 'Error message!';
      const cases = {
        '.error': {
          error: errorMessage,
        },
        '.data.message': {
          data: {
            message: errorMessage,
          },
        },
        '.data.error': {
          data: {
            error: errorMessage,
          },
        },
      };
      const casesNames = Object.keys(cases);
      class MyAPIClient extends APIClient {
        getError<Response extends ErrorResponse>(
          response: Response,
          status: number,
        ): Error {
          return this.formatError(response, status);
        }
      }
      // When
      const sut = new MyAPIClient(options);
      const results = casesNames.map((caseName) => {
        const res = cases[caseName as keyof typeof cases] as unknown as ErrorResponse;
        return sut.getError(res, errorStatus);
      }, {});
      const invalidResult = sut.getError({} as unknown as ErrorResponse, errorStatus);
      expect(results).toEqual(
        new Array(casesNames.length).fill(new HTTPError(errorMessage, errorStatus)),
      );
      expect(invalidResult).toEqual(new HTTPError('Unexpected error', errorStatus));
    });
  });

  describe('provider', () => {
    it('should register the service', () => {
      // Given
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const config = {
        get: jest.fn(() => apiConfig),
      };
      const http = {
        fetch: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
          http,
        },
      });
      // When
      apiClientProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => APIClient]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(APIClient);
      expect(result.getConfig()).toEqual(apiConfig);
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('apiClient', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(3);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'http');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'HTTPError');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'config');
      expect(config.get).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledWith('api');
    });

    it('should register the service with custom options', () => {
      // Given
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const config = {
        get: jest.fn(() => apiConfig),
      };
      const http = {
        fetch: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
          http,
        },
      });
      const serviceName = 'myApiClient';
      // When
      apiClientProvider({ serviceName }).register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => APIClient]];
      lazy();
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith(serviceName, expect.any(Function));
      expect(config.get).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledWith(serviceName);
    });

    it('should register the service with a custom config key', () => {
      // Given
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const apiConfigKey = 'my-api-config';
      const config = {
        get: jest.fn(() => apiConfig),
      };
      const http = {
        fetch: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
          http,
        },
      });
      // When
      apiClientProvider({
        configurationSetting: apiConfigKey,
      }).register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => APIClient]];
      lazy();
      // Then
      expect(config.get).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledWith(apiConfigKey);
    });

    it('should register the service with a sub class', () => {
      // Given
      const apiConfig = {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      };
      const config = {
        get: jest.fn(() => apiConfig),
      };
      const http = {
        fetch: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
          http,
        },
      });
      class MyAPIClient extends APIClient {}
      // When
      apiClientProvider({ clientClass: MyAPIClient }).register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => APIClient]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(MyAPIClient);
      expect(result.getConfig()).toEqual(apiConfig);
    });
  });
});
