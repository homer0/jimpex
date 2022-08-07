import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { providerCreator, type Statuses } from '../../utils';
import type { HTTPErrorClass } from '../common';
import type { DeepPartial, ExpressMiddleware } from '../../types';
/**
 * The options for the error the middleare can generate.
 */
export type EnsureBearerTokenErrorOptions = {
  /**
   * The error message for the response.
   *
   * @default 'Unauthorized'
   */
  message: string;
  /**
   * The HTTP status that will be added to the error context.
   *
   * @default 401
   */
  status: number;
  /**
   * Context information for the error handler and that can be added to the actual
   * response.
   *
   * @default {}
   * @prettierignore
   */
  response: unknown;
};
/**
 * The options to customize the service/middleware.
 */
export type EnsureBearerTokenOptions = {
  error: EnsureBearerTokenErrorOptions;
  expression: RegExp;
  local: string;
};
/**
 * A partial version of the {@link EnsureBearerTokenOptions}, to be used in the
 * constructor and the service provider.
 */
type EnsureBearerTokenPartialOptions = DeepPartial<EnsureBearerTokenOptions>;
/**
 * The options to construct a {@link EnsureBearerToken}.
 */
export type EnsureBearerConstructorOptions = EnsureBearerTokenPartialOptions & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    HTTPError: HTTPErrorClass;
    statuses: Statuses;
  };
};
/**
 * Custom options for the provider that will register an instance of {@link EnsureBearerToken}
 * as a service.
 */
export type EnsureBearerTokenProviderOptions = EnsureBearerTokenPartialOptions & {
  /**
   * The name that will be used to register the service on the container. This is to allow
   * multiple "instances" of the service to be created.
   *
   * @default 'ensureBearerToken'
   */
  serviceName?: string;
};
/**
 * This service gives you a middleware that verifies if a request has an `Authorization`
 * header with a bearer token; if it does, the token will be saved on the `res.locals`,
 * otherwise, it will generate an error.
 *
 * This is a "service middleware" to allow certain flexibility: you can have controllers
 * where some routes are protected and others are not. For those cases, you get the
 * service from the container, and include it only in the routes that need it.
 */
export class EnsureBearerToken {
  /**
   * To generate the errors when the validation fails.
   */
  protected readonly HTTPError: HTTPErrorClass;
  /**
   * The customization options for the service.
   */
  protected readonly options: EnsureBearerTokenOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor({
    inject: { HTTPError, statuses },
    ...options
  }: EnsureBearerConstructorOptions) {
    this.HTTPError = HTTPError;
    this.options = deepAssignWithOverwrite(
      {
        error: {
          message: 'Unauthorized',
          status: statuses('unauthorized'),
          response: {},
        },
        expression: /bearer (.*?)(?:$|\s)/i,
        local: 'token',
      },
      options,
    );
  }
  /**
   * Gets the customization options.
   */
  getOptions(): Readonly<EnsureBearerTokenOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }
  /**
   * Generates the middleware that verifies if a request has an `Authorization` header
   * with a bearer token.
   */
  middleware(): ExpressMiddleware {
    return (req, res, next) => {
      let unauthorized = true;
      const {
        headers: { authorization },
      } = req;
      if (authorization) {
        const matches = this.options.expression.exec(authorization);
        if (matches) {
          const [, token] = matches;
          res.locals[this.options.local] = token;
          unauthorized = false;
        }
      }

      if (unauthorized) {
        const {
          error: { message, status, response },
        } = this.options;
        next(
          new this.HTTPError(message, status, {
            response,
          }),
        );
      } else {
        next();
      }
    };
  }
}
/**
 * Generates a "service middleware" that can be used on route controllers in order to
 * validate the presence of a bearer token on the requests authorization header.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(ensureBearerTokenProvider);
 *
 *   // Let's assume we are in a controller now...
 *   // Getting access to the middleware.
 *   const ensureBearerToken = container.get<ExpressMiddleware>('ensureBearerToken');
 *
 */
export const ensureBearerTokenProvider = providerCreator(
  (options: EnsureBearerTokenProviderOptions = {}) =>
    (app) => {
      const { serviceName = 'ensureBearerToken', ...rest } = options;
      app.set(serviceName, () =>
        new EnsureBearerToken({
          inject: {
            HTTPError: app.get('HTTPError'),
            statuses: app.get('statuses'),
          },
          ...rest,
        }).middleware(),
      );
    },
);
