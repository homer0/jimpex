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
  SimpleConfig,
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

export type GatewayConfigEndpointProps = {
  path: string;
  method?: RouterMethod;
};

export type GatewayConfigEndpointDefinition = string | GatewayConfigEndpointProps;

export type GatewayConfigEndpoints = {
  [key: string]: GatewayConfigEndpointDefinition | GatewayConfigEndpoints;
};

export type GatewayConfig = {
  url: string;
  gateway: GatewayConfigEndpoints;
};

export type GatewayControllerBaseOptions = {
  gatewayConfig: GatewayConfig;
  route: string;
};

export type GatewayControllerHeaderOptions = {
  useXForwardedFor: boolean;
  copyCustomHeaders: boolean;
  copy: string[];
  remove: string[];
};

export type GatewayControllerExtraOptions = {
  root: string;
  apiConfigSetting: string;
  headers: GatewayControllerHeaderOptions;
};

type GatewayControllerPartialExtraOptions = DeepPartial<GatewayControllerExtraOptions>;

type GatewayControllerInitOptions = GatewayControllerBaseOptions &
  GatewayControllerPartialExtraOptions;

export type GatewayControllerRequest = {
  url: string;
  options: HTTPFetchOptions;
};

export type GatewayControllerEndpointInfo = {
  name: string;
  definition: GatewayConfigEndpointDefinition;
};

export type GatewayHelperServiceRequestReducerOptions = {
  endpointReq: GatewayControllerRequest;
  endpoint: GatewayControllerEndpointInfo;
  req: Request;
  res: Response;
  next: NextFunction;
};

export type GatewayHelperServiceRequestReducer = (
  options: GatewayHelperServiceRequestReducerOptions,
) => Promise<GatewayControllerRequest>;

export type GatewayHelperServiceResponseReducerOptions = {
  endpointRes: HTTPResponse;
  endpoint: GatewayControllerEndpointInfo;
  req: Request;
  res: Response;
  next: NextFunction;
};

export type GatewayHelperServiceResponseReducer = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<HTTPResponse>;

export type GatewayHelperServiceStreamVerification = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<boolean>;

export type GatewayHelperServiceResponseHandler = (
  options: GatewayHelperServiceResponseReducerOptions,
) => Promise<void>;

export type GatewayHelperServiceErrorHandlerOptions = {
  error: Error;
  endpoint: GatewayControllerEndpointInfo;
  req: Request;
  res: Response;
  next: NextFunction;
};

export type GatewayHelperServiceErrorHandler = (
  options: GatewayHelperServiceErrorHandlerOptions,
) => void;

export type GatewayHelperService = Partial<{
  reduceEndpointRequest: GatewayHelperServiceRequestReducer;
  reduceEndpointResponse: GatewayHelperServiceResponseReducer;
  shouldStreamEndpointResponse: GatewayHelperServiceStreamVerification;
  handleEndpointResponse: GatewayHelperServiceResponseHandler;
  handleEndpointError: GatewayHelperServiceErrorHandler;
}>;

type GatewayControllerHelperOptions<T> = T & {
  helper: GatewayHelperService;
};

export type GatewayControllerRouteMethod = {
  method: RouterMethod;
  endpoint: GatewayControllerEndpointInfo;
};

export type GatewayControllerRoute = {
  path: string;
  route: string;
  methods: GatewayControllerRouteMethod[];
};

export type GatewayControllerAPIConfig = {
  url: string;
  endpoints: APIClientOptions['endpoints'];
};

export type GatewayControllerAPIConfigOptions = {
  setting?: string;
  placeholders?: Record<string, string>;
};

export type GatewayControllerConstructorOptions = GatewayControllerInitOptions & {
  inject: {
    http: HTTP;
    getHelperService?: () => GatewayHelperService | undefined;
  };
};

type AddRouteOptions = {
  router: Router;
  method: RouterMethod;
  route: string;
  gatewayMiddleware: AsyncExpressMiddleware;
  middlewares: ExpressMiddleware[];
};

export class GatewayController {
  protected readonly http: HTTP;
  protected readonly getHelperService: () => GatewayHelperService | undefined;
  protected readonly gatewayConfig: GatewayConfig;
  protected readonly route: string;
  protected readonly routeExpression: RegExp;
  protected readonly options: GatewayControllerExtraOptions;
  protected readonly endpoints: Record<string, GatewayConfigEndpointDefinition>;
  protected readonly apiConfigUrl: string;
  protected readonly apiConfigEndpoints: APIClientOptions['endpoints'];
  protected readonly routes: GatewayControllerRoute[];
  constructor({
    inject,
    route,
    gatewayConfig,
    ...options
  }: GatewayControllerConstructorOptions) {
    this.http = inject.http;
    this.getHelperService = inject.getHelperService || (() => undefined);
    this.route = removeSlashes(route);
    this.options = this.formatOptions(
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
    this.gatewayConfig = {
      ...gatewayConfig,
      url: removeSlashes(gatewayConfig.url, false, true),
    };
    this.routeExpression = this.createRouteExpression();
    this.endpoints = this.formatEndpoints();
    this.routes = this.createRoutes();
    const { url, endpoints } = this.createAPIConfig();
    this.apiConfigUrl = url;
    this.apiConfigEndpoints = endpoints;
  }

  getOptions(): Readonly<GatewayControllerExtraOptions> {
    return { ...this.options };
  }

  getGatewayConfig(): Readonly<GatewayConfig> {
    return { ...this.gatewayConfig };
  }

  getAPIConfig({
    setting,
    placeholders = {},
  }: GatewayControllerAPIConfigOptions = {}): Readonly<GatewayControllerAPIConfig> {
    const useSetting = setting || this.options.apiConfigSetting;
    let url: string;
    const placeholdersEntries = Object.entries(placeholders);
    if (placeholdersEntries.length) {
      url = placeholdersEntries.reduce<string>(
        (acc, [key, value]) => acc.replace(`:${key}`, value),
        this.apiConfigUrl,
      );
    } else {
      url = this.apiConfigUrl;
    }

    return {
      url,
      endpoints: {
        [useSetting]: this.apiConfigEndpoints,
      },
    };
  }

  addRoutes(router: Router, middlewares: ExpressMiddleware[] = []): Router {
    this.routes.forEach((route) => {
      route.methods.forEach((info) => {
        this.addRoute({
          router,
          method: info.method,
          route: route.route,
          gatewayMiddleware: this.createGatewayMiddleware(info.endpoint),
          middlewares,
        });
      });
    });

    return router;
  }

  protected createGatewayMiddleware(
    endpoint: GatewayControllerEndpointInfo,
  ): AsyncExpressMiddleware {
    return async (req, res, next) => {
      const {
        options: { headers: headersOptions },
        gatewayConfig: { url: gatewayUrl },
        routeExpression,
      } = this;
      const reqPath = req.originalUrl.replace(routeExpression, '');
      let headers: Record<string, string> = {};
      headersOptions.copy.forEach((name) => {
        if (req.headers[name]) {
          headers[name] = req.headers[name] as string;
        }
      });
      if (headersOptions.copyCustomHeaders) {
        headers = deepAssignWithOverwrite<Record<string, string>>(
          headers,
          this.http.getCustomHeadersFromRequest(req),
        );
      }
      if (headersOptions.useXForwardedFor) {
        const ip = this.http.getIPFromRequest(req);
        if (ip) {
          headers['x-forwarded-for'] = ip;
        }
      }

      const method = req.method.toLowerCase();
      let body: string | undefined;
      if (method !== 'GET' && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      }

      const helper = this.getHelperService() || {};

      const helperBasePayload = {
        endpoint,
        req,
        res,
        next,
        helper,
      };

      try {
        const request = await this.reduceEndpointRequest({
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

        const responseRaw = await this.http.fetch(request.url, request.options);
        const response = await this.reduceEndpointResponse({
          endpointRes: responseRaw,
          ...helperBasePayload,
        });

        const shouldStream = await this.shouldStreamEndpointResponse({
          endpointRes: responseRaw,
          ...helperBasePayload,
        });

        if (shouldStream) {
          res.status(response.status);
          response.headers.forEach((value, name) => {
            if (headersOptions.remove.includes(name)) {
              res.setHeader(name, value);
            }
          });

          response.body.pipe(res).on('error', (error) => {
            next(error);
          });
        } else {
          await this.handleEndpointResponse({
            endpointRes: response,
            ...helperBasePayload,
          });
        }
      } catch (error) {
        this.handleEndpointError({
          error: error as Error,
          ...helperBasePayload,
        });
      }
    };
  }

  protected addRoute({
    router,
    method,
    route,
    gatewayMiddleware,
    middlewares,
  }: AddRouteOptions): void {
    router[method](route, [...middlewares, gatewayMiddleware]);
  }

  protected createRouteExpression() {
    return createRouteExpression(
      this.options.root ? `${this.route}/${this.options.root}` : this.route,
      true,
      true,
    );
  }

  protected formatEndpoints(): Record<string, GatewayConfigEndpointDefinition> {
    return flat({
      target: this.gatewayConfig.gateway,
      shouldFlatten: (_, value) => {
        const useValue = value as { path?: string };
        return typeof useValue.path === 'undefined';
      },
    });
  }

  protected createRoutes(): GatewayControllerRoute[] {
    const routes: Record<
      string,
      {
        path: string;
        methods: Partial<Record<RouterMethod, string>>;
      }
    > = {};
    Object.keys(this.endpoints).forEach((name) => {
      const endpoint = this.endpoints[name]!;
      let endpointPath: string;
      let endpointMethod: RouterMethod;
      if (typeof endpoint === 'string') {
        endpointPath = endpoint;
        endpointMethod = 'all';
      } else {
        endpointPath = endpoint.path;
        endpointMethod = endpoint.method
          ? this.validateHTTPMethod(endpoint.method)
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

    const routePrefixes = this.options.root ? `/${this.options.root}/` : '/';
    return Object.keys(routes).map((endpointPath) => {
      const info = routes[endpointPath]!;
      return {
        path: info.path,
        route: `${routePrefixes}${info.path}`,
        methods: Object.keys(info.methods).map((methodNameRaw) => {
          const methodName = methodNameRaw as RouterMethod;
          const endpointName = info.methods[methodName]!;
          const endpointDefinition = this.endpoints[endpointName]!;
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

  protected reduceEndpointRequest({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceRequestReducerOptions>): Promise<GatewayControllerRequest> {
    if (helper.reduceEndpointRequest) {
      return helper.reduceEndpointRequest(options);
    }

    return Promise.resolve(options.endpointReq);
  }

  protected reduceEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<HTTPResponse> {
    if (helper.reduceEndpointResponse) {
      return helper.reduceEndpointResponse(options);
    }

    return Promise.resolve(options.endpointRes);
  }

  protected shouldStreamEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<boolean> {
    if (helper.shouldStreamEndpointResponse) {
      return helper.shouldStreamEndpointResponse(options);
    }

    return Promise.resolve(true);
  }

  protected handleEndpointResponse({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceResponseReducerOptions>): Promise<void> {
    if (!helper.handleEndpointResponse) {
      throw new Error('You must implement handleEndpointResponse');
    }

    return helper.handleEndpointResponse(options);
  }

  protected handleEndpointError({
    helper,
    ...options
  }: GatewayControllerHelperOptions<GatewayHelperServiceErrorHandlerOptions>): void {
    if (helper.handleEndpointError) {
      return helper.handleEndpointError(options);
    }

    return options.next(options.error);
  }

  protected formatOptions(
    options: GatewayControllerExtraOptions,
  ): GatewayControllerExtraOptions {
    if (options.root) {
      const root = removeSlashes(options.root).trim();
      return { ...options, root };
    }

    return options;
  }

  protected validateHTTPMethod(method: string): RouterMethod {
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

  protected createAPIConfig(): GatewayControllerAPIConfig {
    let endpoints: APIClientOptions['endpoints'];
    const { root } = this.options;
    if (root) {
      endpoints = Object.keys(this.endpoints).reduce<
        Record<string, GatewayConfigEndpointDefinition>
      >((acc, name) => {
        const endpoint = this.endpoints[name]!;
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
      endpoints = this.endpoints;
    }

    return {
      url: `/${this.route}`,
      endpoints: unflat({ target: endpoints }),
    };
  }
}

export type GatewayControllerGetMiddlewaresFn = (app: Jimpex) => MiddlewareLike[];

export type GatewayControllerCreatorOptions = GatewayControllerPartialExtraOptions & {
  serviceName?: string;
  helperServiceName?: string;
  gatewaySettingName?: string;
  gatewayClass?: typeof GatewayController;
  getMiddlewares?: GatewayControllerGetMiddlewaresFn;
};

export const gatewayController = controllerProviderCreator(
  (options: GatewayControllerCreatorOptions) => (app, route) => {
    const defaultServiceName = 'apiGateway';
    let defaultHelperServiceName = 'apiGatewayHelper';
    let defaultConfigurationSetting = 'api';
    let { serviceName = defaultServiceName } = options;

    app.set(serviceName, () => {
      if (serviceName !== defaultServiceName) {
        defaultConfigurationSetting = serviceName;
        if (!serviceName.match(/gateway$/i)) {
          serviceName = `${serviceName}Gateway`;
        }
        defaultHelperServiceName = `${serviceName}Helper`;
      }

      const {
        helperServiceName = defaultHelperServiceName,
        gatewaySettingName = defaultConfigurationSetting,
        gatewayClass: GatewayClass = GatewayController,
      } = options;

      return new GatewayClass({
        ...options,
        gatewayConfig: app.get<SimpleConfig>('config').get(gatewaySettingName),
        route,
        inject: {
          http: app.get('http'),
          getHelperService: () => app.try(helperServiceName),
        },
      });
    });

    return controller(() => {
      const ctrl = app.get<GatewayController>(serviceName);
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

      return ctrl.addRoutes(app.get('router'), useMiddlewares);
    });
  },
);
