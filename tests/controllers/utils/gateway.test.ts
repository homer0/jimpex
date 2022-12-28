jest.mock('mime');

import {
  GatewayController,
  gatewayController,
  type GatewayControllerExtraOptions,
  type GatewayHelperService,
  type GatewayHelperServiceRequestReducerOptions,
  type GatewayHelperServiceResponseReducerOptions,
  type GatewayControllerConstructorOptions,
  type GatewayControllerCreatorOptions,
} from '@src/controllers/utils/gateway';
import { statuses, type MiddlewareLike } from '@src/utils';
import type { HTTP } from '@src/services';
// import type { MiddlewareLike } from '@src/utils';
import type {
  AsyncExpressMiddleware,
  ExpressMiddleware,
  Request,
  Response,
} from '@src/types';
import { getRouterMock, getJimpexMock, getConfigMock } from '@tests/mocks';

type FakeHTTPResponse = {
  status: number | string;
  body: {
    pipe: jest.Mock<FakeHTTPResponse['body'], []>;
    on: jest.Mock;
  };
  headers: string[];
};

describe('controllers/utils:gateway', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const options: GatewayControllerConstructorOptions = {
        inject: {
          http: {} as HTTP,
        },
        route: '/gateway',
        gatewayConfig: {
          url: 'some-api',
          gateway: {
            endpoint: 'endpoint',
          },
        },
      };
      // When
      const sut = new GatewayController(options);
      // Then
      expect(sut).toBeInstanceOf(GatewayController);
      expect(sut.getOptions()).toEqual({
        root: '',
        apiConfigSetting: 'api',
        headers: {
          useXForwardedFor: true,
          copyCustomHeaders: true,
          copy: ['authorization', 'content-type', 'referer', 'user-agent'],
          remove: ['server', 'x-powered-by', 'content-encoding'],
        },
      });
      expect(sut.getGatewayConfig()).toEqual(options.gatewayConfig);
    });

    it('should be instantiated with custom options', () => {
      // Given
      const extraOptions: GatewayControllerExtraOptions = {
        root: 'some-root',
        apiConfigSetting: 'some-api',
        headers: {
          useXForwardedFor: false,
          copyCustomHeaders: false,
          copy: ['some-copy'],
          remove: ['some-remove'],
        },
      };
      const options: GatewayControllerConstructorOptions = {
        inject: {
          http: {} as HTTP,
        },
        route: '/gateway',
        gatewayConfig: {
          url: 'some-api',
          gateway: {
            endpoint: 'endpoint',
          },
        },
        ...extraOptions,
      };
      // When
      const sut = new GatewayController(options);
      // Then
      expect(sut).toBeInstanceOf(GatewayController);
      expect(sut.getOptions()).toEqual(extraOptions);
    });

    it('should throw an error when two endpoints share the same path and method', () => {
      // Given
      const options: GatewayControllerConstructorOptions = {
        inject: {
          http: {} as HTTP,
        },
        route: '/gateway',
        gatewayConfig: {
          url: 'some-api',
          gateway: {
            endpointOne: '/my-path',
            endpointTwo: '/my-path',
          },
        },
      };
      // When/Then
      expect(() => new GatewayController(options)).toThrow(
        /You can't have two gateway endpoints to the same path/i,
      );
    });

    describe('getAPIConfig', () => {
      it('should generate a config for an API client', () => {
        // Given
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          gatewayConfig: {
            url: 'some-api',
            gateway: {
              endpoint: 'endpoint',
            },
          },
        };
        // When
        const sut = new GatewayController(options);
        const result = sut.getAPIConfig();
        // Then
        expect(sut).toBeInstanceOf(GatewayController);
        expect(result).toEqual({
          url: options.route,
          endpoints: {
            api: {
              ...options.gatewayConfig.gateway,
            },
          },
        });
      });

      it('should generate a config for an API client with a custom root', () => {
        // Given
        const root = 'my-root';
        const endpoints = {
          endpointOne: '/my-path/one',
          endpointTwo: {
            path: '/my-path/two',
          },
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          root,
          gatewayConfig: {
            url: 'some-api',
            gateway: endpoints,
          },
        };
        // When
        const sut = new GatewayController(options);
        const result = sut.getAPIConfig();
        // Then
        expect(sut).toBeInstanceOf(GatewayController);
        expect(result).toEqual({
          url: options.route,
          endpoints: {
            api: {
              endpointOne: `${root}${endpoints.endpointOne}`,
              endpointTwo: {
                path: `${root}${endpoints.endpointTwo.path}`,
              },
            },
          },
        });
      });

      it('should generate a config for an API client with a custom key', () => {
        // Given
        const apiConfigSetting = 'some-api';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          gatewayConfig: {
            url: 'some-api',
            gateway: {
              endpoint: 'endpoint',
            },
          },
        };
        // When
        const sut = new GatewayController(options);
        const result = sut.getAPIConfig({
          setting: apiConfigSetting,
        });
        // Then
        expect(sut).toBeInstanceOf(GatewayController);
        expect(result).toEqual({
          url: options.route,
          endpoints: {
            [apiConfigSetting]: {
              ...options.gatewayConfig.gateway,
            },
          },
        });
      });

      it('should replace placeholders in the URL', () => {
        // Given
        const version = 'development';
        const type = 'rest';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway/:version/entry/:type',
          gatewayConfig: {
            url: 'some-api',
            gateway: {
              endpoint: 'endpoint',
            },
          },
        };
        // When
        const sut = new GatewayController(options);
        const result = sut.getAPIConfig({
          placeholders: {
            version,
            type,
          },
        });
        // Then
        expect(sut).toBeInstanceOf(GatewayController);
        expect(result).toEqual({
          url: `/gateway/${version}/entry/${type}`,
          endpoints: {
            api: {
              ...options.gatewayConfig.gateway,
            },
          },
        });
      });
    });

    describe('addRoutes', () => {
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
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          gatewayConfig,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        const result = sut.addRoutes(router);
        // Then
        expect(result).toBe(router);
        expect(routerMocks.all).toHaveBeenCalledTimes(1);
        expect(routerMocks.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
          expect.any(Function),
        ]);
        expect(router.post).toHaveBeenCalledTimes(1);
        expect(router.post).toHaveBeenCalledWith(gatewayConfig.gateway.endpointTwo.path, [
          expect.any(Function),
        ]);
      });

      it('should add the gateway routes to the router with a custom root', () => {
        // Given
        const root = 'my-root';
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
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          root,
          gatewayConfig,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        const result = sut.addRoutes(router);
        // Then
        expect(result).toBe(router);
        expect(routerMocks.all).toHaveBeenCalledTimes(1);
        expect(routerMocks.all).toHaveBeenCalledWith(
          `/${root}${gatewayConfig.gateway.endpointOne}`,
          [expect.any(Function)],
        );
        expect(router.post).toHaveBeenCalledTimes(1);
        expect(router.post).toHaveBeenCalledWith(
          `/${root}${gatewayConfig.gateway.endpointTwo.path}`,
          [expect.any(Function)],
        );
      });

      it('should add the gateway routes to the router with custom middlewares', () => {
        // Given
        const middlewares = ['middlewareOne', 'middlewareTwo'];
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
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          gatewayConfig,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        const result = sut.addRoutes(
          router,
          middlewares as unknown as ExpressMiddleware[],
        );
        // Then
        expect(result).toBe(router);
        expect(routerMocks.all).toHaveBeenCalledTimes(1);
        expect(routerMocks.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
          ...middlewares,
          expect.any(Function),
        ]);
        expect(router.post).toHaveBeenCalledTimes(1);
        expect(router.post).toHaveBeenCalledWith(gatewayConfig.gateway.endpointTwo.path, [
          ...middlewares,
          expect.any(Function),
        ]);
      });

      it("should use `all` when an endpoint doesn't have a valid HTTP method", () => {
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
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: {} as HTTP,
          },
          route: '/gateway',
          gatewayConfig,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        const result = sut.addRoutes(router);
        // Then
        expect(result).toBe(router);
        expect(routerMocks.all).toHaveBeenCalledTimes(1);
        expect(routerMocks.all).toHaveBeenCalledWith(
          gatewayConfig.gateway.endpointOne.path,
          [expect.any(Function)],
        );
      });
    });

    describe('middleware', () => {
      it('should stream a gateway request response', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
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
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
          headers: {
            // @ts-expect-error - The iterator for headers goes `value, name`.
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
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
          },
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

      it("shouldn't add custom headers to the request", async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
          getIPFromRequest: jest.fn(),
          getCustomHeadersFromRequest: jest.fn(),
        };
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(http.getCustomHeadersFromRequest).toHaveBeenCalledTimes(0);
        expect(http.getIPFromRequest).toHaveBeenCalledTimes(0);
        expect(http.fetch).toHaveBeenCalledTimes(1);
        expect(http.fetch).toHaveBeenCalledWith(
          `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          {
            method: request.method,
            headers: {},
          },
        );
      });

      it('should stream a gateway request that includes a body', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: [],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
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
          },
        );
      });

      it("should add the content type for JSON when there's a body but no header", async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: [],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
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
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
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
          },
        );
      });

      it('should call the next middleware if the streaming fails', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: [],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
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
        const { router, routerMocks } = getRouterMock();
        const error = new Error('MyError');
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        const [[, onError]] = httpResponse.body.on.mock.calls as unknown as [
          [string, (err: Error) => void],
        ];
        onError(error);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(error);
      });

      it('should call the next middleware if the request fails', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponseStatus = statuses('ok');
        const httpResponse: FakeHTTPResponse = {
          status: httpResponseStatus,
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: [],
        };
        const error = new Error('MyError');
        const http = {
          fetch: jest.fn(() => Promise.reject(error)),
        };
        const route = '/my-gateway';
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
          },
          route,
          gatewayConfig,
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
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(error);
      });
    });

    describe('middleware with helper', () => {
      it('should be able to modify the request', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponse: FakeHTTPResponse = {
          status: statuses('ok'),
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
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
        const route = '/my-gateway';
        const helper = {
          reduceEndpointRequest: jest.fn(
            (reqOptions: GatewayHelperServiceRequestReducerOptions) =>
              Promise.resolve({
                ...reqOptions.endpointReq,
                url: `${reqOptions.endpointReq.url}-by-helper`,
              }),
          ),
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
            getHelperService: jest.fn(() => helper as unknown as GatewayHelperService),
          },
          route,
          gatewayConfig,
          headers: {
            // @ts-expect-error - The iterator for headers goes `value, name`.
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(options.inject.getHelperService).toHaveBeenCalledTimes(1);
        expect(helper.reduceEndpointRequest).toHaveBeenCalledTimes(1);
        expect(helper.reduceEndpointRequest).toHaveBeenCalledWith({
          endpointReq: {
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
          endpoint: {
            name: 'endpointOne',
            definition: gatewayConfig.gateway.endpointOne,
          },
          req: request,
          res: response,
          next,
        });
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
          },
        );
      });

      it('should be able to modify the response', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponse: FakeHTTPResponse = {
          status: statuses('ok'),
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const status = statuses('conflict');
        const helper = {
          reduceEndpointResponse: jest.fn(
            (resOptions: GatewayHelperServiceResponseReducerOptions) =>
              Promise.resolve({
                ...resOptions.endpointRes,
                status,
              }),
          ),
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
            getHelperService: jest.fn(() => helper as unknown as GatewayHelperService),
          },
          route,
          gatewayConfig,
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(helper.reduceEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.reduceEndpointResponse).toHaveBeenCalledWith({
          endpointRes: httpResponse,
          endpoint: {
            name: 'endpointOne',
            definition: gatewayConfig.gateway.endpointOne,
          },
          req: request,
          res: response,
          next,
        });
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(status);
      });

      it('should be able to handle the response', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponse: FakeHTTPResponse = {
          status: statuses('ok'),
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const helper = {
          shouldStreamEndpointResponse: jest.fn(() => Promise.resolve(false)),
          handleEndpointResponse: jest.fn(),
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
            getHelperService: jest.fn(() => helper as unknown as GatewayHelperService),
          },
          route,
          gatewayConfig,
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(helper.shouldStreamEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.shouldStreamEndpointResponse).toHaveBeenCalledWith({
          endpointRes: httpResponse,
          endpoint: {
            name: 'endpointOne',
            definition: gatewayConfig.gateway.endpointOne,
          },
          req: request,
          res: response,
          next,
        });
        expect(helper.handleEndpointResponse).toHaveBeenCalledTimes(1);
        expect(helper.handleEndpointResponse).toHaveBeenCalledWith({
          endpointRes: httpResponse,
          endpoint: {
            name: 'endpointOne',
            definition: gatewayConfig.gateway.endpointOne,
          },
          req: request,
          res: response,
          next,
        });
      });

      it("should call next middleware if stream is disabled but there's no handler", async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponse: FakeHTTPResponse = {
          status: statuses('ok'),
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
        };
        const http = {
          fetch: jest.fn(() => Promise.resolve(httpResponse)),
        };
        const route = '/my-gateway';
        const helper = {
          shouldStreamEndpointResponse: jest.fn(() => Promise.resolve(false)),
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
            getHelperService: jest.fn(() => helper as unknown as GatewayHelperService),
          },
          route,
          gatewayConfig,
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
        const next = jest.fn();
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringMatching(/You must implement handleEndpointResponse/i),
          }),
        );
      });

      it('should be able to handle an error', async () => {
        // Given
        const gatewayConfig = {
          url: 'http://my-api.com',
          gateway: {
            endpointOne: 'my-path-one',
          },
        };
        const httpResponse: FakeHTTPResponse = {
          status: statuses('ok'),
          body: {
            pipe: jest.fn(() => httpResponse.body),
            on: jest.fn(),
          },
          headers: ['content-type', 'server'],
        };
        const error = new Error('MyError');
        const http = {
          fetch: jest.fn(() => Promise.reject(error)),
        };
        const route = '/my-gateway';
        const helper = {
          handleEndpointError: jest.fn(),
        };
        const options: GatewayControllerConstructorOptions = {
          inject: {
            http: http as unknown as HTTP,
            getHelperService: jest.fn(() => helper as unknown as GatewayHelperService),
          },
          route,
          gatewayConfig,
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
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new GatewayController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
          [string, [AsyncExpressMiddleware]],
        ];
        await middleware(
          request as unknown as Request,
          response as unknown as Response,
          next,
        );
        // Then
        expect(helper.handleEndpointError).toHaveBeenCalledTimes(1);
        expect(helper.handleEndpointError).toHaveBeenCalledWith({
          error,
          endpoint: {
            name: 'endpointOne',
            definition: gatewayConfig.gateway.endpointOne,
          },
          req: request,
          res: response,
          next,
        });
      });
    });
  });

  describe('provider', () => {
    it('should register the routes and return the router', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(gatewayConfig);
      const { router, routerMocks } = getRouterMock();
      const {
        container,
        containerMocks: mocks,
        resources,
      } = getJimpexMock({
        save: true,
        resources: {
          config,
          router,
        },
      });
      const route = '/my-gateway';
      // When
      const result = gatewayController
        .register(container, route)
        .connect(container, route);
      // eslint-disable-next-line dot-notation
      const service = resources['apiGateway'];
      // Then
      expect(result).toBe(router);
      expect(service).toBeInstanceOf(GatewayController);
      expect(routerMocks.all).toHaveBeenCalledTimes(1);
      expect(routerMocks.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        expect.any(Function),
      ]);
      expect(configMocks.get).toHaveBeenCalledTimes(1);
      expect(configMocks.get).toHaveBeenCalledWith('api');
      expect(mocks.get).toHaveBeenCalledTimes(4);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'http');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'apiGateway');
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'router');
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('apiGateway', expect.any(Function));
    });

    it('should be created with a custom name', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(gatewayConfig);
      const { router } = getRouterMock();
      const {
        container,
        containerMocks: mocks,
        resources,
      } = getJimpexMock({
        save: true,
        resources: {
          config,
          router,
        },
      });
      const route = '/my-gateway';
      const options: GatewayControllerCreatorOptions = {
        serviceName: 'myService',
      };
      const expectedName = `${options.serviceName}Gateway`;
      // When
      gatewayController(options).register(container, route).connect(container, route);
      // eslint-disable-next-line dot-notation
      const service = resources[expectedName];
      // Then
      expect(service).toBeInstanceOf(GatewayController);
      expect(mocks.get).toHaveBeenCalledTimes(4);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'http');
      expect(mocks.get).toHaveBeenNthCalledWith(3, expectedName);
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'router');
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith(expectedName, expect.any(Function));
    });

    it('should be created with a custom name, custom setting and custom helper name', async () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(gatewayConfig);
      const httpResponse: FakeHTTPResponse = {
        status: statuses('ok'),
        body: {
          pipe: jest.fn(() => httpResponse.body),
          on: jest.fn(),
        },
        headers: [],
      };
      const http = {
        fetch: jest.fn(() => Promise.resolve(httpResponse)),
      };
      const helperServiceName = 'myGatewayHelper';
      const helper = {
        reduceEndpointRequest: jest.fn(
          (reqOptions: GatewayHelperServiceRequestReducerOptions) =>
            Promise.resolve({
              ...reqOptions.endpointReq,
              url: `${reqOptions.endpointReq.url}-by-helper`,
            }),
        ),
      };
      const { router, routerMocks } = getRouterMock();
      const { container, containerMocks: mocks } = getJimpexMock({
        save: true,
        resources: {
          http,
          config,
          router,
          [helperServiceName]: helper,
        },
      });
      const route = '/my-gateway';
      const options: GatewayControllerCreatorOptions = {
        serviceName: 'myServiceGateway',
        gatewaySettingName: 'myConfigSetting',
        helperServiceName: 'myGatewayHelper',
        headers: {
          copyCustomHeaders: false,
          useXForwardedFor: false,
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
      const next = jest.fn();
      // When
      gatewayController(options).register(container, route).connect(container, route);
      const [[, [middleware]]] = routerMocks.all.mock.calls as unknown as [
        [string, [AsyncExpressMiddleware]],
      ];
      await middleware(
        request as unknown as Request,
        response as unknown as Response,
        next,
      );
      // Then
      expect(mocks.get).toHaveBeenCalledTimes(4);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'http');
      expect(mocks.get).toHaveBeenNthCalledWith(3, options.serviceName);
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'router');
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith(helperServiceName);
      expect(helper.reduceEndpointRequest).toHaveBeenCalledTimes(1);
      expect(helper.reduceEndpointRequest).toHaveBeenCalledWith({
        endpointReq: {
          url: `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}`,
          options: {
            method: request.method,
            headers: {},
          },
        },
        endpoint: {
          name: 'endpointOne',
          definition: gatewayConfig.gateway.endpointOne,
        },
        req: request,
        res: response,
        next,
      });
      expect(http.fetch).toHaveBeenCalledTimes(1);
      expect(http.fetch).toHaveBeenCalledWith(
        `${gatewayConfig.url}/${gatewayConfig.gateway.endpointOne}-by-helper`,
        {
          method: request.method,
          headers: {},
        },
      );
    });

    it('should be created with custom middlewares', () => {
      // Given
      const gatewayConfig = {
        url: 'http://my-api.com',
        gateway: {
          endpointOne: '/my-path/one',
        },
      };
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(gatewayConfig);
      const { router, routerMocks } = getRouterMock();
      const { container } = getJimpexMock({
        save: true,
        resources: {
          config,
          router,
        },
      });
      const route = '/my-gateway';
      const middlewareOne = {
        name: 'middlewareOne',
      };
      const middlewareTwoStr = 'middlewareTwo';
      const middlewareTwo = {
        middleware: true,
        connect: jest.fn(() => middlewareTwoStr),
      };
      const middlewareThree = {
        middleware: true,
        connect: jest.fn(),
      };
      const middlewares = [middlewareOne, middlewareTwo, middlewareThree];
      const getMiddlewares = jest.fn(() => middlewares as unknown as MiddlewareLike[]);
      const options: GatewayControllerCreatorOptions = {
        serviceName: 'myService',
        getMiddlewares,
      };
      // When
      gatewayController(options).register(container, route).connect(container, route);
      // Then
      expect(routerMocks.all).toHaveBeenCalledTimes(1);
      expect(routerMocks.all).toHaveBeenCalledWith(gatewayConfig.gateway.endpointOne, [
        ...[middlewareOne, middlewareTwoStr],
        expect.any(Function),
      ]);
    });
  });
});
