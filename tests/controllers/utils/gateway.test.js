jest.unmock('/src/utils/functions');
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/controllers/utils/gateway');

const statuses = require('statuses');
require('jasmine-expect');
const {
  GatewayController,
  gatewayController,
} = require('/src/controllers/utils/gateway');

describe('controllers/utils:gateway', () => {
  describe('instance', () => {
    it('should be instantiated with its default options', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {},
      };
      const route = '/my-gateway';
      const http = 'http';
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http);
      // Then
      expect(sut).toBeInstanceOf(GatewayController);
      expect(sut.addRoutes).toBeFunction();
      expect(sut.gatewayConfig).toEqual(gatewayConfig);
      expect(sut.options).toEqual({
        root: '',
        configurationSetting: 'api',
        headers: {
          useXForwardedFor: true,
          copyCustomHeaders: true,
          copy: [
            'authorization',
            'content-type',
            'referer',
            'user-agent',
          ],
          remove: [
            'server',
            'x-powered-by',
          ],
        },
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {},
      };
      const route = '/my-gateway';
      const http = 'http';
      const options = {
        root: 'my-root',
        configurationSetting: 'myApi',
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
          copy: ['authorization'],
          remove: ['x-powered-by'],
        },
      };
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      // Then
      expect(sut).toBeInstanceOf(GatewayController);
      expect(sut.options).toEqual(options);
    });

    it('should throw an error when two endpoints share the same path and method', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path',
          endpointTwo: '/my-path',
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      // When/Then
      expect(() => new GatewayController(gatewayConfig, route, http))
      .toThrow(/You can't have two gateway endpoints to the same path/i);
    });

    it('should create a configuration for an API client', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      let sut = null;
      let result = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http);
      result = sut.endpointsForAPIClient;
      // Then
      expect(result).toEqual({
        url: route,
        endpoints: {
          [sut.options.configurationSetting]: gatewayConfig.gateway,
        },
      });
    });

    it('should create a configuration for an API client with a custom root', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      const root = 'my-root';
      const configurationSetting = 'myRootedAPI';
      const options = {
        root,
        configurationSetting,
      };
      let sut = null;
      let result = null;
      const expectedEndpoints = {
        endpointOne: `${root}${gatewayConfig.gateway.endpointOne}`,
        endpointTwo: {
          path: `${root}${gatewayConfig.gateway.endpointTwo.path}`,
        },
      };
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      result = sut.endpointsForAPIClient;
      // Then
      expect(result).toEqual({
        url: route,
        endpoints: {
          [configurationSetting]: expectedEndpoints,
        },
      });
    });

    it('should add the gateway routes to the router', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
            method: 'post',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      const router = {
        all: jest.fn(),
        post: jest.fn(),
      };
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http);
      sut.addRoutes(router);
      // Then
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(router.post).toHaveBeenCalledTimes(1);
      expect(router.post).toHaveBeenCalledWith(
        gatewayConfig.gateway.endpointTwo.path,
        [expect.any(Function)]
      );
    });

    it('should add the gateway routes to the router with a custom root', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
            method: 'post',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      const root = 'my-root';
      const options = { root };
      const router = {
        all: jest.fn(),
        post: jest.fn(),
      };
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      // Then
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(
        `/${root}${gatewayConfig.gateway.endpointOne}`,
        [expect.any(Function)]
      );
      expect(router.post).toHaveBeenCalledTimes(1);
      expect(router.post).toHaveBeenCalledWith(
        `/${root}${gatewayConfig.gateway.endpointTwo.path}`,
        [expect.any(Function)]
      );
    });

    it('should add the gateway routes to the router with a custom middleware', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
            method: 'post',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      const middleware = 'my-middleware';
      const router = {
        all: jest.fn(),
        post: jest.fn(),
      };
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http);
      sut.addRoutes(router, [middleware]);
      // Then
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        middleware,
        expect.any(Function),
      ]);
      expect(router.post).toHaveBeenCalledTimes(1);
      expect(router.post).toHaveBeenCalledWith(
        gatewayConfig.gateway.endpointTwo.path,
        [
          middleware,
          expect.any(Function),
        ]
      );
    });

    it('should use `all` when an endpoint doesn\'t have a valid HTTP method', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: {
            path: '/my-path/one',
            method: 'myCosmicMethod',
          },
        },
      };
      const route = '/my-gateway';
      const http = 'http';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http);
      sut.addRoutes(router);
      // Then
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(
        gatewayConfig.gateway.endpointOne.path,
        [expect.any(Function)]
      );
    });
  });

  describe('middleware', () => {
    it('should stream a gateway request response', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [
          'content-type',
          'server',
        ],
      };
      const ip = '25.09.2015';
      const customHeaderName = 'x-custom-header';
      const customHeaderValue = 'my-custom-header-value';
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
        getIPFromRequest: jest.fn(() => ip),
        getCustomHeadersFromRequest: jest.fn(() => ({
          [customHeaderName]: customHeaderValue,
        })),
      };
      const options = {
        headers: {
          // This is stupid, but the iterator for headers goes `value, name`.
          remove: [1],
        },
      };
      const headerToCopy = 'authorization';
      const headerToCopyValue = 'bearer abc';
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'GET',
        headers: {
          [headerToCopy]: [headerToCopyValue],
        },
      };
      const response = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledTimes(1);
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledWith(request);
        expect(http.getIPFromRequest).toHaveBeenCalledTimes(1);
        expect(http.getIPFromRequest).toHaveBeenCalledWith(request);
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {
              [headerToCopy]: [headerToCopyValue],
              [customHeaderName]: customHeaderValue,
              'x-forwarded-for': ip,
            },
          }
        );
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(httpResponse.status);
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith(0, httpResponse.headers[0]);
        expect(httpResponse.body.pipe).toHaveBeenCalledTimes(1);
        expect(httpResponse.body.pipe).toHaveBeenCalledWith(response);
        expect(httpResponse.body.on).toHaveBeenCalledTimes(1);
        expect(httpResponse.body.on).toHaveBeenCalledWith('error', expect.any(Function));
      });
    });

    it('shouldn\'t add custom headers to the request', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [
          'content-type',
          'server',
        ],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
        getIPFromRequest: jest.fn(),
        getCustomHeadersFromRequest: jest.fn(),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'GET',
        headers: {},
      };
      const response = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledTimes(0);
        expect(http.getIPFromRequest).toHaveBeenCalledTimes(0);
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {},
          }
        );
      });
    });

    it('should stream a gateway request that includes a body', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const headerToCopy = 'content-type';
      const headerToCopyValue = 'application/json';
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'POST',
        headers: {
          [headerToCopy]: [headerToCopyValue],
        },
        body: {
          myProp: 'myValue',
        },
      };
      const response = {
        status: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {
              [headerToCopy]: [headerToCopyValue],
            },
            body: JSON.stringify(request.body),
          }
        );
      });
    });

    it('should add the content type for JSON when there\'s a body but no header', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'POST',
        headers: {},
        body: {
          myProp: 'myValue',
        },
      };
      const response = {
        status: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(request.body),
          }
        );
      });
    });

    it('should call the next middleware if the streaming fails', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'POST',
        headers: {},
        body: {
          myProp: 'myValue',
        },
      };
      const response = {
        status: jest.fn(),
      };
      const next = jest.fn();
      const router = {
        all: jest.fn(),
      };
      const error = new Error('MyError');
      let sut = null;
      let middleware = null;
      let onError = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        [[, onError]] = httpResponse.body.on.mock.calls;
        onError(error);
        // Then
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(request.body),
          }
        );
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(error);
      });
    });

    it('should call the next middleware if the request fails', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const error = new Error('MyError');
      const http = {
        fetch: jest.fn(() => Promise.reject(error)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'POST',
        headers: {},
        body: {
          myProp: 'myValue',
        },
      };
      const response = {
        status: jest.fn(),
      };
      const next = jest.fn();
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('middleware with helper', () => {
    it('should be able to modify the request', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [
          'content-type',
          'server',
        ],
      };
      const ip = '25.09.2015';
      const customHeaderName = 'x-custom-header';
      const customHeaderValue = 'my-custom-header-value';
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
        getIPFromRequest: jest.fn(() => ip),
        getCustomHeadersFromRequest: jest.fn(() => ({
          [customHeaderName]: customHeaderValue,
        })),
      };
      const options = {
        headers: {
          // This is stupid, but the iterator for headers goes `value, name`.
          remove: [1],
        },
      };
      const helper = {
        reduceEndpointRequest: jest.fn((request) => Object.assign({}, request, {
          url: `${request.url}-by-helper`,
          options: request.options,
        })),
      };
      const headerToCopy = 'authorization';
      const headerToCopyValue = 'bearer abc';
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'GET',
        headers: {
          [headerToCopy]: [headerToCopyValue],
        },
      };
      const response = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options, helper);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledTimes(1);
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledWith(request);
        expect(http.getIPFromRequest).toHaveBeenCalledTimes(1);
        expect(http.getIPFromRequest).toHaveBeenCalledWith(request);
        expect(helper.reduceEndpointRequest).toHaveBeenCalledTimes(1);
        expect(helper.reduceEndpointRequest).toHaveBeenCalledWith(
          {
            url: `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
            options: {
              method: request.method,
              headers: {
                [headerToCopy]: [headerToCopyValue],
                [customHeaderName]: customHeaderValue,
                'x-forwarded-for': ip,
              },
            },
          },
          {
            name: 'endpointOne',
            settings: gatewayConfig.gateway.endpointOne,
          },
          request,
          response,
          next
        );
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}-by-helper`,
          {
            method: request.method,
            headers: {
              [headerToCopy]: [headerToCopyValue],
              [customHeaderName]: customHeaderValue,
              'x-forwarded-for': ip,
            },
          }
        );
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(httpResponse.status);
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith(0, httpResponse.headers[0]);
        expect(httpResponse.body.pipe).toHaveBeenCalledTimes(1);
        expect(httpResponse.body.pipe).toHaveBeenCalledWith(response);
        expect(httpResponse.body.on).toHaveBeenCalledTimes(1);
        expect(httpResponse.body.on).toHaveBeenCalledWith('error', expect.any(Function));
      });
    });

    it('should be able to modify the response', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [
          'content-type',
          'server',
        ],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const helper = {
        reduceEndpointResponse: jest.fn((response) => Object.assign({}, response, {
          status: statuses.conflict,
        })),
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'GET',
        headers: {},
      };
      const response = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options, helper);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(helper.reduceEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.reduceEndpointResponse).toHaveBeenCalledWith(
          httpResponse,
          {
            name: 'endpointOne',
            settings: gatewayConfig.gateway.endpointOne,
          },
          request,
          response,
          next
        );
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(statuses.conflict);
      });
    });

    it('should be able to handle the response', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const httpResponse = {
        status: statuses.ok,
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [
          'content-type',
          'server',
        ],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const helper = {
        shouldStreamEndpointResponse: jest.fn(() => false),
        handleEndpointResponse: jest.fn(),
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'GET',
        headers: {},
      };
      const response = {
        status: jest.fn(),
        setHeader: jest.fn(),
      };
      const next = 'next';
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options, helper);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(helper.shouldStreamEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.shouldStreamEndpointResponse).toHaveBeenCalledWith(
          httpResponse,
          {
            name: 'endpointOne',
            settings: gatewayConfig.gateway.endpointOne,
          },
          request,
          response,
          next
        );
        expect(helper.handleEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.handleEndpointResponse).toHaveBeenCalledWith(
          httpResponse,
          {
            name: 'endpointOne',
            settings: gatewayConfig.gateway.endpointOne,
          },
          request,
          response,
          next
        );
      });
    });

    it('should be able to handle an error', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: 'my-path-one',
        },
      };
      const route = '/my-gateway';
      const error = new Error('MyError');
      const http = {
        fetch: jest.fn(() => Promise.reject(error)),
      };
      const options = {
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
        },
      };
      const helper = {
        handleEndpointError: jest.fn(),
      };
      const request = {
        originalUrl: `${route}/${gatewayConfig.gateway.endpointOne}`,
        method: 'POST',
        headers: {},
        body: {
          myProp: 'myValue',
        },
      };
      const response = {
        status: jest.fn(),
      };
      const next = jest.fn();
      const router = {
        all: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new GatewayController(gatewayConfig, route, http, options, helper);
      sut.addRoutes(router);
      [[, [middleware]]] = router.all.mock.calls;
      return middleware(request, response, next)
      .then(() => {
        // Then
        expect(helper.handleEndpointError).toHaveBeenCalledTimes(1);
        expect(helper.handleEndpointError).toHaveBeenCalledWith(
          error,
          {
            name: 'endpointOne',
            settings: gatewayConfig.gateway.endpointOne,
          },
          request,
          response,
          next
        );
      });
    });
  });

  describe('shorthand', () => {
    it('should register the routes and return the router', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const appConfiguration = {
        get: jest.fn(() => gatewayConfig),
      };
      const router = {
        all: jest.fn(),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
        set: jest.fn(),
        try: jest.fn(),
      };
      const route = '/my-gateway';
      let result = null;
      let service = null;
      const expectedGetServices = [
        'appConfiguration',
        'http',
        'router',
      ];
      // When
      result = gatewayController.connect(app, route);
      [[, service]] = app.set.mock.calls;
      // Then
      expect(result).toBe(router);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith('api');
      expect(app.get).toHaveBeenCalledTimes(expectedGetServices.length);
      expectedGetServices.forEach((name) => {
        expect(app.get).toHaveBeenCalledWith(name);
      });
      expect(app.try).toHaveBeenCalledTimes(1);
      expect(app.try).toHaveBeenCalledWith('apiGatewayHelper');
      expect(app.set).toHaveBeenCalledTimes(1);
      expect(app.set).toHaveBeenCalledWith('apiGateway', expect.any(Function));
      expect(service).toBeFunction();
      expect(service()).toBeInstanceOf(GatewayController);
    });

    it('should be created with a custom name', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const appConfiguration = {
        get: jest.fn(() => gatewayConfig),
      };
      const router = {
        all: jest.fn(),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
        set: jest.fn(),
        try: jest.fn(),
      };
      const route = '/my-gateway';
      let result = null;
      let service = null;
      const expectedGetServices = [
        'appConfiguration',
        'http',
        'router',
      ];
      const options = {
        serviceName: 'myService',
      };
      // When
      result = gatewayController(options).connect(app, route);
      [[, service]] = app.set.mock.calls;
      // Then
      expect(result).toBe(router);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith(options.serviceName);
      expect(app.get).toHaveBeenCalledTimes(expectedGetServices.length);
      expectedGetServices.forEach((name) => {
        expect(app.get).toHaveBeenCalledWith(name);
      });
      expect(app.try).toHaveBeenCalledTimes(1);
      expect(app.try).toHaveBeenCalledWith(`${options.serviceName}GatewayHelper`);
      expect(app.set).toHaveBeenCalledTimes(1);
      expect(app.set).toHaveBeenCalledWith(`${options.serviceName}Gateway`, expect.any(Function));
      expect(service).toBeFunction();
      expect(service()).toBeInstanceOf(GatewayController);
    });

    it('should be created with a custom name, custom setting and custom helper name', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const appConfiguration = {
        get: jest.fn(() => gatewayConfig),
      };
      const router = {
        all: jest.fn(),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
        set: jest.fn(),
        try: jest.fn(),
      };
      const route = '/my-gateway';
      let result = null;
      let service = null;
      const expectedGetServices = [
        'appConfiguration',
        'http',
        'router',
      ];
      const options = {
        serviceName: 'myServiceGateway',
        configurationSetting: 'myConfigSetting',
        helperServiceName: 'myGatewayHelper',
      };
      // When
      result = gatewayController(options).connect(app, route);
      [[, service]] = app.set.mock.calls;
      // Then
      expect(result).toBe(router);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith(options.configurationSetting);
      expect(app.get).toHaveBeenCalledTimes(expectedGetServices.length);
      expectedGetServices.forEach((name) => {
        expect(app.get).toHaveBeenCalledWith(name);
      });
      expect(app.try).toHaveBeenCalledTimes(1);
      expect(app.try).toHaveBeenCalledWith(options.helperServiceName);
      expect(app.set).toHaveBeenCalledTimes(1);
      expect(app.set).toHaveBeenCalledWith(options.serviceName, expect.any(Function));
      expect(service).toBeFunction();
      expect(service()).toBeInstanceOf(GatewayController);
    });

    it('should be created without a helper service', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const appConfiguration = {
        get: jest.fn(() => gatewayConfig),
      };
      const router = {
        all: jest.fn(),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
        set: jest.fn(),
        try: jest.fn(),
      };
      const route = '/my-gateway';
      let result = null;
      let service = null;
      const expectedGetServices = [
        'appConfiguration',
        'http',
        'router',
      ];
      const options = {
        serviceName: 'myServiceGateway',
        configurationSetting: 'myConfigSetting',
        helperServiceName: null,
      };
      // When
      result = gatewayController(options).connect(app, route);
      [[, service]] = app.set.mock.calls;
      // Then
      expect(result).toBe(router);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(appConfiguration.get).toHaveBeenCalledTimes(1);
      expect(appConfiguration.get).toHaveBeenCalledWith(options.configurationSetting);
      expect(app.get).toHaveBeenCalledTimes(expectedGetServices.length);
      expectedGetServices.forEach((name) => {
        expect(app.get).toHaveBeenCalledWith(name);
      });
      expect(app.try).toHaveBeenCalledTimes(0);
      expect(app.set).toHaveBeenCalledTimes(1);
      expect(app.set).toHaveBeenCalledWith(options.serviceName, expect.any(Function));
      expect(service).toBeFunction();
      expect(service()).toBeInstanceOf(GatewayController);
    });

    it('should be created with custom middlewares', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const appConfiguration = {
        get: jest.fn(() => gatewayConfig),
      };
      const router = {
        all: jest.fn(),
      };
      const services = {
        appConfiguration,
        router,
      };
      const app = {
        get: jest.fn((name) => services[name] || name),
        set: jest.fn(),
        try: jest.fn(),
      };
      const route = '/my-gateway';
      let result = null;
      const options = {
        serviceName: 'myServiceGateway',
        configurationSetting: 'myConfigSetting',
        helperServiceName: null,
      };
      const normalMiddleware = 'middlewareOne';
      const jimpexMiddlewareName = 'middlewareTwo';
      const jimpexMiddleware = {
        connect: jest.fn(() => jimpexMiddlewareName),
      };
      const middlewares = [normalMiddleware, jimpexMiddleware];
      const middlewareGenerator = jest.fn(() => middlewares);
      // When
      result = gatewayController(options, middlewareGenerator).connect(app, route);
      // Then
      expect(result).toBe(router);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        normalMiddleware,
        jimpexMiddlewareName,
        expect.any(Function),
      ]);
    });
  });
});
