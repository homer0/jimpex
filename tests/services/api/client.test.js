jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/api/client');

require('jasmine-expect');
const {
  APIClient,
  apiClient,
} = require('/src/services/api/client');
const APIClientBase = require('wootils/shared/apiClient');

describe('services/api:client', () => {
  it('should be instantiated with its configuration', () => {
    // Given
    const apiConfig = {
      url: 'my-api',
      endpoints: {
        info: 'api-info',
      },
    };
    const http = {
      fetch: () => {},
    };
    const HTTPError = 'HTTPError';
    let sut = null;
    // When
    sut = new APIClient(apiConfig, http, HTTPError);
    // Then
    expect(sut).toBeInstanceOf(APIClientBase);
    expect(sut).toBeInstanceOf(APIClient);
    expect(sut.apiConfig).toEqual(apiConfig);
    expect(sut.url).toBe(apiConfig.url);
    expect(sut.endpoints).toEqual(apiConfig.endpoints);
  });

  it('should format error responses using the HTTPError service', () => {
    // Given
    const apiConfig = {
      url: 'my-api',
      endpoints: {
        info: 'api-info',
      },
    };
    const http = {
      fetch: () => {},
    };
    class HTTPError {
      constructor(message, status) {
        this.message = message;
        this.status = status;
      }
    }
    const response = {
      data: {
        message: 'Damn it!',
      },
    };
    const status = 409;
    let sut = null;
    let result = null;
    // When
    sut = new APIClient(apiConfig, http, HTTPError);
    result = sut.error(response, status);
    // Then
    expect(result).toBeInstanceOf(HTTPError);
    expect(result.message).toBe(response.data.message);
    expect(result.status).toBe(status);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const appConfiguration = {
      api: {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      },
      get: jest.fn(() => appConfiguration.api),
    };
    const http = {
      fetch: 'fetch',
    };
    const services = {
      appConfiguration,
      http,
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (services[service] || service)),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    apiClient.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(sut).toBeInstanceOf(APIClientBase);
    expect(sut).toBeInstanceOf(APIClient);
    expect(sut.apiConfig).toBe(appConfiguration.api);
    expect(sut.url).toBe(appConfiguration.api.url);
    expect(sut.endpoints).toEqual(appConfiguration.api.endpoints);
    expect(sut.fetchClient).toBe(http.fetch);
    expect(serviceName).toBe('apiClient');
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('api');
  });

  it('should include a provider creactor to configure its options', () => {
    // Given
    const appConfiguration = {
      apiConfig: {
        url: 'my-api',
        endpoints: {
          info: 'api-info',
        },
      },
      get: jest.fn(() => appConfiguration.apiConfig),
    };
    const http = {
      fetch: 'fetch',
    };
    const services = {
      appConfiguration,
      http,
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (services[service] || service)),
    };
    const name = 'myAPI';
    const configurationKey = 'my-api';
    const ClientClass = APIClient;
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    apiClient(name, configurationKey, ClientClass).register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(sut).toBeInstanceOf(APIClientBase);
    expect(sut).toBeInstanceOf(APIClient);
    expect(sut.apiConfig).toBe(appConfiguration.apiConfig);
    expect(sut.url).toBe(appConfiguration.apiConfig.url);
    expect(sut.endpoints).toEqual(appConfiguration.apiConfig.endpoints);
    expect(sut.fetchClient).toBe(http.fetch);
    expect(serviceName).toBe(name);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(configurationKey);
  });
});
