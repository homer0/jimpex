import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { flat, unflat } from '@homer0/object-utils';
import type { APIClientOptions } from '@homer0/api-utils';
import {
  controllerProviderCreator,
  controller,
  createRouteExpression,
  removeSlashes,
  notUndefined,
  type MiddlewareLike,
} from '../../utils';
import type { HTTP, HTTPFetchOptions } from '../../services';
import type { Jimpex } from '../../app';
import {
  RouterMethod,
  DeepPartial,
  Request,
  Response,
  NextFunction,
  HTTPResponse,
  Router,
  ExpressMiddleware,
  AsyncExpressMiddleware,
} from '../../types';
/**
 * The extended definition for endpoints.
 *
 * @group Controllers/Gateway
 */
export type GatewayConfigEndpointProps = {
  /**
   * The path to the endpoint relative to the entry point. It can include placeholders for
   * parameters like `/:parameter/`.
   */
  path: string;
  /**
   * The router (HTTP) method for the endpoint.
   *
   * @default 'all'
   */
  method?: RouterMethod;
};
/**
 * The definition of an endpoint: it can be just the path, relative to the entry point, or
 * an object in which you can also specify things like the method.
 *
 * @group Controllers/Gateway
 */
export type GatewayConfigEndpointDefinition = string | GatewayConfigEndpointProps;
/**
 * The dictionary of endpoints the controller uses. The reason for this type is that this
 * could be a flat dictionary, or a nested one.
 *
 * @example
 *
 * <caption>A flat dictionary</caption>
 *
 * {
 *   random: '/random',
 *   users: '/users',
 *   userById: {
 *     path: '/users/:id',
 *     method: 'get',
 *   },
 * }
 *
 * @example
 *
 * <caption>A nested dictionary</caption>
 *
 * {
 *   random: '/random',
 *   users: {
 *     list: '/users',
 *     byId: {
 *       path: '/users/:id',
 *       method: 'get',
 *     },
 *   },
 * }
 *
 * @group Controllers/Gateway
 */
export type GatewayConfigEndpoints = {
  [key: string]: GatewayConfigEndpointDefinition | GatewayConfigEndpoints;
};
/**
 * The configuration for the gateway the controller uses.
 *
 * @group Controllers/Gateway
 */
export type GatewayConfig = {
  /**
   * The entry point to the API the controller will make the requests to.
   */
  url: string;
  /**
   * The dictionary of enpoints the gateway will make available.
   */
  gateway: GatewayConfigEndpoints;
};
/**
 * The options for how the gateway will handle the headers from the requests and the
 * responses.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerHeaderOptions = {
  /**
   * Whether or not to include the header with the request's IP address.
   *
   * @default true
   */
  useXForwardedFor: boolean;
  /**
   * Whether or not to copy all custom headers from the request. By custom header, it
   * means all the headers which names start with `x-`.
   *
   * @default true
   */
  copyCustomHeaders: boolean;
  /**
   * A list of "known" headers the gateway will try to copy from the incoming request.
   *
   * @default ['authorization','content-type', 'referer', 'user-agent']
   */
  copy: string[];
  /**
   * A list of "known" headers the gateway will try to remove the response.
   *
   * @default ['server', 'x-powered-by']
   */
  remove: string[];
};
/**
 * The extra options for the gateway controller. They are "extra" because they are mostly
 * helpers for when used with an API client, or for optional features.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerExtraOptions = {
  /**
   * This is really a helper for when the gateway is used with an API client. The idea is
   * that, by default, the routes are mounted on the controller route, but with this
   * option, you can specify another sub path. For example: The controller is mounted on
   * `/routes`, and if you set `root` to `gateway`, all the routes will be on
   * `/routes/gateway`.
   *
   * This become important (and useful) when you get the API client configuration (with
   * `getAPIConfig`): The `url` will be the controller route, but all the endpoints will
   * be modified and prefixed with the `root`, that way, you can have multiple gateways in
   * the same "base route".
   *
   * It can also includes placeholders for parameters like `/:parameter/`, that will be
   * replaced with the `placeholders` option when `getAPIConfig` gets called.
   *
   * @default ''
   */
  root: string;
  /**
   * This is another option for when the gateway is used with an API client. When calling
   * `getAPIConfig`, all the endpoints will be wrapped inside an object named after this
   * option. For example: `{ url: '...', endpoints: { api: { ... } } }`.
   *
   * @default 'api'
   */
  apiConfigSetting: string;
  /**
   * The options for how the gateway will handle the headers from the requests and the
   * responses.
   */
  headers: GatewayControllerHeaderOptions;
};
/**
 * The required options for the gateway controller.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerOptions = {
  /**
   * The configuration for the API the gateway will make the requests to.
   */
  gatewayConfig: GatewayConfig;
  /**
   * The route where the controller is mounted.
   */
  route: string;
} & DeepPartial<GatewayControllerExtraOptions>;
/**
 * The information for a request the controller will make.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerRequest = {
  /**
   * The URL for the request.
   */
  url: string;
  /**
   * The options for the fetch client that will make the requests.
   */
  options: HTTPFetchOptions;
};
/**
 * The information for an endpoint the gateway is calling.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerEndpointInfo = {
  /**
   * The name of the endpoint in the configuration.
   */
  name: string;
  /**
   * The properties (path and method) of the endpoint.
   */
  definition: GatewayConfigEndpointDefinition;
};
/**
 * These are the base options sent to all the helper service functions.
 *
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceBaseFnOptions = {
  /**
   * The information of the endpoint the gateway is calling.
   */
  endpoint: GatewayControllerEndpointInfo;
  /**
   * The request recived by the application.
   */
  req: Request;
  /**
   * The response object created by the application.
   */
  res: Response;
  /**
   * The function to call the next middleware in the chain.
   */
  next: NextFunction;
};
/**
 * The information sent to the helper service in order to modify, or not, a request before
 * it is sent.
 *
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceRequestReducerOptions =
  GatewayHelperServiceBaseFnOptions & {
    /**
     * The options the controller created for the fetch client.
     */
    endpointReq: GatewayControllerRequest;
  };
/**
 * A function that can be used to modify the information of an endpoint before making a
 * request.
 *
 * @param options  The information of the request.
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceRequestReducer = (
  options: GatewayHelperServiceRequestReducerOptions,
) => Promise<GatewayControllerRequest>;
/**
 * The information sent to the helper service in order to modify a response before
 * processing it, decide if it should be streamed or not, and even handle it.
 *
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceResponseReducerOptions =
  GatewayHelperServiceBaseFnOptions & {
    /**
     * The response from the endpoint request.
     */
    endpointRes: HTTPResponse;
  };
/**
 * A function that can be used to modify the response of an endpoint before the controller
 * processes it.
 *
 * @param options  The information of the response.
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceResponseReducer = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<HTTPResponse>;
/**
 * A function that can be used to tell the controller to stream the response of an
 * endpoint or not.
 * If it returns `false`, the function to handle responses should be defined, otherwise,
 * an error will be generated.
 *
 * @param options  The information of the response.
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceStreamVerification = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<boolean>;
/**
 * A function to handle the response of an endpoint. This is called when the helper
 * service tells the controller that the endpoint shouldn't be streamed, so this method
 * should handle the response.
 *
 * @param options  The information of the response.
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceResponseHandler = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<void>;
/**
 * The information sent to the helper service in order to handle a failed request for an
 * endpoint.
 *
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceErrorHandlerOptions =
  GatewayHelperServiceBaseFnOptions & {
    /**
     * The error generated during the request.
     */
    error: Error;
  };
/**
 * A function to handle the error of an endpoint request.
 *
 * @param options  The information of the error.
 * @group Controllers/Gateway
 */
export type GatewayHelperServiceErrorHandler = (
  options: GatewayHelperServiceErrorHandlerOptions,
) => void;
/**
 * The interface of a helper service that can intercept/modify the requests and responses
 * the gateway makes.
 *
 * @group Controllers/Gateway
 */
export type GatewayHelperService = Partial<{
  /**
   * A function that is called before an endpoint request is made.
   */
  reduceEndpointRequest: GatewayHelperServiceRequestReducer;
  /**
   * A function that is called with the response of an endpoint request.
   */
  reduceEndpointResponse: GatewayHelperServiceResponseReducer;
  /**
   * A function called in order to validate if an endpoint response should be streamed or
   * not. If the function returns `false`, `handleEndpointResponse` will be called.
   */
  shouldStreamEndpointResponse: GatewayHelperServiceStreamVerification;
  /**
   * A function called when `shouldStreamEndpointResponse` returns `false`. The function
   * should handle the response for the application.
   */
  handleEndpointResponse: GatewayHelperServiceResponseHandler;
  /**
   * A function called when an error is generated during an endpoint request/processing.
   */
  handleEndpointError: GatewayHelperServiceErrorHandler;
}>;
/**
 * Utility type for the options object sent to the "proxy methods" the controller has for
 * the helper service.
 *
 * @template T  The type of the options for a specific helper service function.
 * @access protected
 * @group Controllers/Gateway
 */
export type GatewayControllerHelperOptions<T> = T & {
  /**
   * The reference for the helper service.
   */
  helper: GatewayHelperService;
};
/**
 * The information for a single HTTP method an endpoint can handle.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerRouteMethod = {
  /**
   * The method for the route.
   */
  method: RouterMethod;
  /**
   * The information of the endpoint.
   */
  endpoint: GatewayControllerEndpointInfo;
};
/**
 * The information for all the HTTP methods that can be handled for an endpoint.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerRoute = {
  /**
   * The path to the endpoint, relative to the entry point.
   */
  path: string;
  /**
   * The path for the route in the controller. This is different from `path` as it's possible for
   * the gateway to be implemented using the `root` option.
   */
  route: string;
  /**
   * A list with all the methods the controller uses on the route.
   */
  methods: GatewayControllerRouteMethod[];
};
/**
 * The API client configuration the gateway can generate for its endpoints.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerAPIConfig = {
  /**
   * The base URL for the API.
   */
  url: string;
  /**
   * The dictionary of endpoints the controller handles.
   */
  endpoints: APIClientOptions['endpoints'];
};
/**
 * The options sent to {@link GatewayController.getAPIConfig}.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerAPIConfigOptions = {
  /**
   * This can be used to overwrite the gateway's `apiConfigSetting` option, and set a new
   * setting as a wrapper for the endpoints.
   */
  setting?: string;
  /**
   * A dictionary of values for possible placeholders that were sent using the `root`
   * option.
   */
  placeholders?: Record<string, string>;
};
/**
 * The options to construct a {@link GatewayController}.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerConstructorOptions = GatewayControllerOptions & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    http: HTTP;
    /**
     * A function to get a possible helper service. This is injected as a "getter" to not
     * interrupt the DIC "lifecycle": controllers are initialized right when the app
     * starts, and injecting a reference would force the service to be initialized too,
     * even if a request is not being made.
     */
    getHelperService?: () => GatewayHelperService | undefined;
  };
};
/**
 * The options for {@link GatewayController._addRoute}.
 *
 * @access protected
 * @group Controllers/Gateway
 */
export type AddGatewayRouteOptions = {
  /**
   * The reference for the router in which the middlewares will be added.
   */
  router: Router;
  /**
   * The router method in which the middlewares will be added.
   */
  method: RouterMethod;
  /**
   * The route in which the middlewares will be added.
   */
  route: string;
  /**
   * The middleware created by {@link GatewayController}, that makes the request.
   */
  gatewayMiddleware: AsyncExpressMiddleware;
  /**
   * A list of extra middlewares to prepend to the gateway middleware.
   */
  middlewares: ExpressMiddleware[];
};
/**
 * A utility controller that generates routes that act as a gateway for a specific API.
 *
 * @group Controller Classes
 * @group Controllers/Gateway
 * @prettierignore
 */
export class GatewayController {
  /**
   * The service that makes HTTP requests.
   */
  protected readonly http: HTTP;
  /**
   * A function to get a possible helper service. This is injected as a "getter" to not
   * interrupt the DIC "lifecycle": controllers are initialized right when the app
   * starts, and injecting a reference would force the service to be initialized too,
   * even if a request is not being made.
   */
  protected readonly _getHelperService: () => GatewayHelperService | undefined;
  /**
   * The information, url and endpoints, for the gateway the controller will make requests to.
   */
  protected readonly _gatewayConfig: GatewayConfig;
  /**
   * The route in which the controller is mounted.
   */
  protected readonly _route: string;
  /**
   * A regular expression that will be used to remove the controller route from a
   * request path. This will allow the main middleware to extract the path to where the
   * request should be made.
   */
  protected readonly _routeExpression: RegExp;
  /**
   * The controller customization options.
   */
  protected readonly _options: GatewayControllerExtraOptions;
  /**
   * A flat dictionary with the endpoints information.
   */
  protected readonly _endpoints: Record<string, GatewayConfigEndpointDefinition>;
  /**
   * The entry URL for the API client configuration the controller can generate.
   */
  protected readonly _apiConfigUrl: string;
  /**
   * The generated endpoints for the API client configuration the controller can generate.
   */
  protected readonly _apiConfigEndpoints: APIClientOptions['endpoints'];
  /**
   * The list of routes the controller can handle.
   */
  protected readonly _routes: GatewayControllerRoute[];
  /**
   * @param options  The options to construct the controller.
   */
  constructor({
    inject,
    route,
    gatewayConfig,
    ...options
  }: GatewayControllerConstructorOptions) {
    this.http = inject.http;
    this._getHelperService = inject.getHelperService || (() => undefined);
    this._route = removeSlashes(route);
    this._options = this._formatOptions(
      deepAssignWithOverwrite(
        {
          root: '',
          apiConfigSetting: 'api',
          headers: {
            useXForwardedFor: true,
            copyCustomHeaders: true,
            copy: ['authorization', 'content-type', 'referer', 'user-agent'],
            remove: ['server', 'x-powered-by', 'content-encoding'],
          },
        },
        options,
      ),
    );
    this._gatewayConfig = {
      ...gatewayConfig,
      url: removeSlashes(gatewayConfig.url, false, true),
    };
    this._routeExpression = createRouteExpression(
      this._options.root ? `${this._route}/${this._options.root}` : this._route,
      true,
      true,
    );
    this._endpoints = this._formatEndpoints();
    this._routes = this._createRoutes();
    const { url, endpoints } = this._createAPIConfig();
    this._apiConfigUrl = url;
    this._apiConfigEndpoints = endpoints;
  }
  /**
   * Generates an API client configuration based on the controller routes.
   *
   * @param options  The options to customize the generated configuration.
   */
  getAPIConfig({
    setting,
    placeholders = {},
  }: GatewayControllerAPIConfigOptions = {}): Readonly<GatewayControllerAPIConfig> {
    const useSetting = setting || this._options.apiConfigSetting;
    let url: string;
    const placeholdersEntries = Object.entries(placeholders);
    if (placeholdersEntries.length) {
      url = placeholdersEntries.reduce<string>(
        (acc, [key, value]) => acc.replace(`:${key}`, value),
        this._apiConfigUrl,
      );
    } else {
      url = this._apiConfigUrl;
    }

    return {
      url,
      endpoints: {
        [useSetting]: this._apiConfigEndpoints,
      },
    };
  }
  /**
   * Mounts the middlewares in the router in order to make the requests.
   *
   * @param router       A reference to the application router.
   * @param middlewares  A list of extra middlewares to execute before the gateway
   *                     middleware.
   */
  addRoutes(router: Router, middlewares: ExpressMiddleware[] = []): Router {
    this._routes.forEach((route) => {
      route.methods.forEach((info) => {
        this._addRoute({
          router,
          method: info.method,
          route: route.route,
          gatewayMiddleware: this._createGatewayMiddleware(info.endpoint),
          middlewares,
        });
      });
    });

    return router;
  }
  /**
   * The customization options.
   */
  get options(): Readonly<GatewayControllerExtraOptions> {
    return { ...this._options };
  }
  /**
   * The configuration for the gateway the controller will make requests to.
   */
  get gatewayConfig(): Readonly<GatewayConfig> {
    return { ...this._gatewayConfig };
  }
  /**
   * Generates a middleware that will make the request to an endpoint and stream the
   * response.
   *
   * @param endpoint  The information of the endpoint the middleware will handle.
   */
  protected _createGatewayMiddleware(
    endpoint: GatewayControllerEndpointInfo,
  ): AsyncExpressMiddleware {
    return async (req, res, next) => {
      const {
        _options: { headers: headersOptions },
        _gatewayConfig: { url: gatewayUrl },
        _routeExpression: routeExpression,
      } = this;
      // Remove the controller route from the requested URL.
      const reqPath = req.originalUrl.replace(routeExpression, '');
      // Process the headers for the request.
      let headers: Record<string, string> = {};
      // - Copy the headers from the incoming request.
      headersOptions.copy.forEach((name) => {
        if (req.headers[name]) {
          headers[name] = req.headers[name] as string;
        }
      });
      // - Copy the custom headers.
      if (headersOptions.copyCustomHeaders) {
        headers = deepAssignWithOverwrite<Record<string, string>>(
          headers,
          this.http.getCustomHeadersFromRequest(req),
        );
      }
      // - Include the IP on the X-Forwarded-For header, if enabled.
      if (headersOptions.useXForwardedFor) {
        const ip = this.http.getIPFromRequest(req);
        if (ip) {
          headers['x-forwarded-for'] = ip;
        }
      }

      const method = req.method.toUpperCase();
      // If the request has a body and the method is not `GET`, stringify it.
      let body: string | undefined;
      if (method !== 'GET' && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        // If there's no `content-type`, let's assume it's JSON.
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      }

      /**
       * Get the helper service, if there's one, and define the base options for its
       * methods.
       */
      const helper = this._getHelperService() || {};
      const helperBasePayload = {
        endpoint,
        req,
        res,
        next,
        helper,
      };

      try {
        // Reduce the request information before using it.
        const request = await this._reduceEndpointRequest({
          endpointReq: {
            url: `${gatewayUrl}/${reqPath}`,
            options: {
              method,
              headers,
              body,
            },
          },
          ...helperBasePayload,
        });
        // Make the actual request.
        const responseRaw = await this.http.fetch(request.url, request.options);
        // Reduce the response information before using it.
        const response = await this._reduceEndpointResponse({
          endpointRes: responseRaw,
          ...helperBasePayload,
        });
        // Validate if the response should be streamed.
        const shouldStream = await this._shouldStreamEndpointResponse({
          endpointRes: responseRaw,
          ...helperBasePayload,
        });

        if (shouldStream) {
          /**
           * If the response should be streamed, set the status, remove unwanted headers,
           * and pipe it to the application response object.
           */
          res.status(response.status);
          response.headers.forEach((value, name) => {
            if (!headersOptions.remove.includes(name)) {
              res.setHeader(name, value);
            }
          });

          response.body.pipe(res).on('error', (error) => {
            next(error);
          });
        } else {
          /**
           * If the response should not be streamed, send it to the helper method to
           * handle it.
           */
          await this._handleEndpointResponse({
            endpointRes: response,
            ...helperBasePayload,
          });
        }
      } catch (error) {
        // Something failed, so let's pass the error to the helper service.
        this._handleEndpointError({
          error: error as Error,
          ...helperBasePayload,
        });
      }
    };
  }
  /**
   * Mounts the middleware(s) for an endpoint in the router.
   *
   * @param options  The information of the endpoint and how it needs to be added.
   */
  protected _addRoute({
    router,
    method,
    route,
    gatewayMiddleware,
    middlewares,
  }: AddGatewayRouteOptions): void {
    router[method](route, [...middlewares, gatewayMiddleware]);
  }
  /**
   * Formats the endpoints for the gateway into a flat dictionary without nesting.
   */
  protected _formatEndpoints(): Record<string, GatewayConfigEndpointDefinition> {
    return flat({
      target: this._gatewayConfig.gateway,
      shouldFlatten: (_, value) => {
        const useValue = value as { path?: string };
        return typeof useValue.path === 'undefined';
      },
    });
  }
  /**
   * Based on the information from the endpoints, this method will create the routes the
   * controller will later add on a router.
   *
   * @throws If there's more than one endpoint using the same path with the same HTTP
   *         method.
   */
  protected _createRoutes(): GatewayControllerRoute[] {
    const routes: Record<
      string,
      {
        path: string;
        methods: Partial<Record<RouterMethod, string>>;
      }
    > = {};
    Object.keys(this._endpoints).forEach((name) => {
      const endpoint = this._endpoints[name]!;
      let endpointPath: string;
      let endpointMethod: RouterMethod;
      if (typeof endpoint === 'string') {
        endpointPath = endpoint;
        endpointMethod = 'all';
      } else {
        endpointPath = endpoint.path;
        endpointMethod = endpoint.method
          ? this._validateHTTPMethod(endpoint.method)
          : 'all';
      }

      endpointPath = removeSlashes(endpointPath);
      if (!routes[endpointPath]) {
        routes[endpointPath] = {
          path: endpointPath,
          methods: {},
        };
      }

      if (routes[endpointPath]!.methods[endpointMethod]) {
        const repeatedEndpoint = routes[endpointPath]!.methods[endpointMethod];
        throw new Error(
          "You can't have two gateway endpoints to the same path and with the same " +
            `HTTP method: '${repeatedEndpoint}' and '${name}'`,
        );
      }

      routes[endpointPath]!.methods[endpointMethod] = name;
    });

    const routePrefixes = this._options.root ? `/${this._options.root}/` : '/';
    return Object.keys(routes).map((endpointPath) => {
      const info = routes[endpointPath]!;
      return {
        path: info.path,
        route: `${routePrefixes}${info.path}`,
        methods: Object.keys(info.methods).map((methodNameRaw) => {
          const methodName = methodNameRaw as RouterMethod;
          const endpointName = info.methods[methodName]!;
          const endpointDefinition = this._endpoints[endpointName]!;
          return {
            method: methodName,
            endpoint: {
              name: endpointName,
              definition: endpointDefinition,
            },
          };
        }),
      };
    });
  }
  /**
   * This is a "proxy method" to call the helper service's function that can modify an
   * endpoint request before it gets made.
   *
   * The reason this is a "proxy method" is in case the controller gets subclassed and
   * "used itself as a helper" instead of relying on a difference one.
   *
   * If the helper doesn't implement `reduceEndpointRequest`, it will just return
   * information for the request.
   *
   * @param options  The information of the request and the reference to the helper.
   */
  protected _reduceEndpointRequest({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceRequestReducerOptions>): Promise<GatewayControllerRequest> {
    if (helper.reduceEndpointRequest) {
      return helper.reduceEndpointRequest(options);
    }

    return Promise.resolve(options.endpointReq);
  }
  /**
   * This is a "proxy method" to call the helper service's function that can modify an
   * endpoint response before it gets processed.
   *
   * The reason this is a "proxy method" is in case the controller gets subclassed and
   * "used itself as a helper" instead of relying on a difference one.
   *
   * If the helper doesn't implement `reduceEndpointResponse`, it will just return
   * information for the response.
   *
   * @param options  The information of the response and the reference to the helper.
   */
  protected _reduceEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<HTTPResponse> {
    if (helper.reduceEndpointResponse) {
      return helper.reduceEndpointResponse(options);
    }

    return Promise.resolve(options.endpointRes);
  }
  /**
   * This is a "proxy method" to call the helper service's function that can decide if an
   * endpoint response should be streamed or not.
   *
   * The reason this is a "proxy method" is in case the controller gets subclassed and
   * "used itself as a helper" instead of relying on a difference one.
   *
   * If the helper doesn't implement `shouldStreamEndpointResponse`, it will just return
   * `true`.
   *
   * @param options  The information of the response and the reference to the helper.
   */
  protected _shouldStreamEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<boolean> {
    if (helper.shouldStreamEndpointResponse) {
      return helper.shouldStreamEndpointResponse(options);
    }

    return Promise.resolve(true);
  }
  /**
   * This is a "proxy method" to call the helper service's function that handles a
   * response in case it already said that a response shouldn't be streamed.
   *
   * The reason this is a "proxy method" is in case the controller gets subclassed and
   * "used itself as a helper" instead of relying on a difference one.
   *
   * If the helper doesn't implement `shouldStreamEndpointResponse`, it will throw an
   * error.
   *
   * @param options  The information of the response and the reference to the helper.
   * @throws If the helper doesn't implement `handleEndpointResponse`.
   */
  protected _handleEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<void> {
    if (!helper.handleEndpointResponse) {
      throw new Error('You must implement handleEndpointResponse');
    }

    return helper.handleEndpointResponse(options);
  }
  /**
   * This is a "proxy method" to call the helper service's function that handles an error
   * on an endpoint request.
   *
   * The reason this is a "proxy method" is in case the controller gets subclassed and
   * "used itself as a helper" instead of relying on a difference one.
   *
   * If the helper doesn't implement `handleEndpointError`, it will just send the error to
   * the next middleware/error handler.
   *
   * @param options  The information of the response and the reference to the helper.
   */
  protected _handleEndpointError({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceErrorHandlerOptions>): void {
    if (helper.handleEndpointError) {
      return helper.handleEndpointError(options);
    }

    return options.next(options.error);
  }
  /**
   * Validates and formats the customization options sent to the controller.
   *
   * @param options  The options sent to the constructor.
   */
  protected _formatOptions(
    options: GatewayControllerExtraOptions,
  ): GatewayControllerExtraOptions {
    if (options.root) {
      const root = removeSlashes(options.root).trim();
      return { ...options, root };
    }

    return options;
  }
  /**
   * Validates a router/HTTP method that the controller intends to use for an endpoint. If
   * it's not valid, it will return `all`.
   *
   * @param method  The HTTP method for the endpoint.
   */
  protected _validateHTTPMethod(method: string): RouterMethod {
    const newMethod = method.toLowerCase();
    return [
      'get',
      'head',
      'post',
      'patch',
      'put',
      'delete',
      'connect',
      'options',
      'trace',
    ].includes(newMethod)
      ? (newMethod as RouterMethod)
      : 'all';
  }
  /**
   * Creates the API client configuration based on the controller routes.
   */
  protected _createAPIConfig(): GatewayControllerAPIConfig {
    let endpoints: APIClientOptions['endpoints'];
    const { root } = this._options;
    if (root) {
      endpoints = Object.keys(this._endpoints).reduce<
        Record<string, GatewayConfigEndpointDefinition>
      >((acc, name) => {
        const endpoint = this._endpoints[name]!;
        let newEndpoint;
        if (typeof endpoint === 'string') {
          newEndpoint = removeSlashes(endpoint);
          newEndpoint = `${root}/${newEndpoint}`;
        } else {
          const endpointPath = removeSlashes(endpoint.path);
          newEndpoint = {
            ...endpoint,
            path: `${root}/${endpointPath}`,
          };
        }

        acc[name] = newEndpoint;
        return acc;
      }, {});
    } else {
      endpoints = this._endpoints;
    }

    return {
      url: `/${this._route}`,
      endpoints: unflat({ target: endpoints }),
    };
  }
}
/**
 * A function to generate a list of middlewares that can be executed before the tontroller
 * main middleware.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerGetMiddlewaresFn = (app: Jimpex) => MiddlewareLike[];
/**
 * The options for the controller creator that mounts the {@link GatewayController}.
 *
 * @group Controllers/Gateway
 */
export type GatewayControllerCreatorOptions =
  DeepPartial<GatewayControllerExtraOptions> & {
    /**
     * The name the creator will use to register the controller in the container. No,
     * this is not a typo. The creator will register the controller so other services can
     * access the `getAPIConfig` method. The service will be available after the app
     * routes are mounted.
     * If this is overwritten, the creator will ensure that the name ends with `Gateway`;
     * and if overwritten, but it doesn't include `Gateway` at the end, and no
     * `gatewaySettingName` was defined, the creator will use the custom name (without
     * `Gatway`) for `gatewaySettingName`.
     *
     * @default 'apiGateway'
     */
    serviceName?: string;
    /**
     * The name of the helper service the creator will try to obtain from the container.
     * If `serviceName` is overwritten, the default for this will be
     * `${serviceName}Helper`.
     *
     * @default 'apiGatewayHelper'
     */
    helperServiceName?: string;
    /**
     * The name of the configuration setting where the gateway configuration is stored. If
     * not overwritten, check the description of `serviceName` to understand which will be
     * its default value.
     *
     * @default 'api'
     */
    gatewaySettingName?: string;
    /**
     * The class the creator will instantiate. Similar to the API Client, this allows for
     * extra customization as you can send a custom subclass of the
     * {@link GatewayController}.
     *
     * @default GatewayController
     */
    gatewayClass?: typeof GatewayController;
    /**
     * A function to generate a list of middlewares that can be executed before the
     * controller main middleware.
     */
    getMiddlewares?: GatewayControllerGetMiddlewaresFn;
  };
/**
 * Creates a controller that allows the application to mount routes that will work like
 * gateway to a specific API.
 *
 * @group Controllers
 * @group Controllers/Gateway
 */
export const gatewayController = controllerProviderCreator(
  (options: GatewayControllerCreatorOptions = {}) =>
    (app, route) => {
      /**
       * Formats the name in order to keep consistency with the helper service and the
       * configuration setting: If the `serviceName` is different from the default, make
       * sure it ends with `Gateway`, set the default helper service name to
       * `${serviceName}Helper`, and the default configuration setting to the same as the
       * service name (without the `Gateway`).
       * This way, if you just use `myApi`, the service name will be `myApiGateway`, the
       * helper name will be `myApiGatewayHelper` and the configuration setting `myApi`.
       */
      const defaultServiceName = 'apiGateway';
      let defaultHelperServiceName = 'apiGatewayHelper';
      let defaultConfigSetting = 'api';
      let { serviceName = defaultServiceName } = options;
      if (serviceName !== defaultServiceName) {
        defaultConfigSetting = serviceName;
        if (!serviceName.match(/gateway$/i)) {
          serviceName = `${serviceName}Gateway`;
        }
        defaultHelperServiceName = `${serviceName}Helper`;
      }
      // Register the service.
      app.set(serviceName, () => {
        const {
          helperServiceName = defaultHelperServiceName,
          gatewaySettingName = defaultConfigSetting,
          gatewayClass: GatewayClass = GatewayController,
        } = options;

        const gtConfig = app.getConfig<GatewayConfig>(gatewaySettingName);

        return new GatewayClass({
          ...options,
          apiConfigSetting: gatewaySettingName,
          gatewayConfig: gtConfig,
          route,
          inject: {
            http: app.get('http'),
            getHelperService: () => app.try(helperServiceName),
          },
        });
      });

      return controller(() => {
        // Get the controller.
        const ctrl = app.get<GatewayController>(serviceName);
        /**
         * Check if there are actual middlewares to be included, and in case there are
         * Jimpex middlewares, connect them.
         */
        let useMiddlewares: ExpressMiddleware[] | undefined;
        if (options.getMiddlewares) {
          useMiddlewares = options
            .getMiddlewares(app)
            .map((middleware) => {
              if ('middleware' in middleware) {
                return middleware.connect(app) as ExpressMiddleware | undefined;
              }

              return middleware as ExpressMiddleware;
            })
            .filter(notUndefined);
        }

        // Add the routes to the router and return it.
        return ctrl.addRoutes(app.get('router'), useMiddlewares);
      });
    },
);
