import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { providerCreator, type Statuses } from '../../utils/index.js';
import type { HTTPErrorClass } from '../common/index.js';
import type { DeepPartial, ExpressMiddleware } from '../../types/index.js';
/**
 * The options for the error the middleware can generate.
 *
 * @group Services/EnsureBearerToken
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
   */
  response: unknown;
};
/**
 * The options to customize the service/middleware.
 *
 * @group Services/EnsureBearerToken
 */
export type EnsureBearerTokenOptions = {
  error: EnsureBearerTokenErrorOptions;
  expression: RegExp;
  local: string;
};
/**
 * The options to construct a {@link EnsureBearerToken}.
 *
 * @group Services/EnsureBearerToken
 */
export type EnsureBearerConstructorOptions = DeepPartial<EnsureBearerTokenOptions> & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    HTTPError: HTTPErrorClass;
    statuses: Statuses;
  };
};
/**
 * Custom options for the provider that will register an instance of
 * {@link EnsureBearerToken}
 * as a service.
 *
 * @group Services/EnsureBearerToken
 */
export type EnsureBearerTokenProviderOptions = DeepPartial<EnsureBearerTokenOptions> & {
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
 *
 * @group Services
 * @group Services/EnsureBearerToken
 */
export class EnsureBearerToken {
  /**
   * To generate the errors when the validation fails.
   */
  protected readonly _HTTPError: HTTPErrorClass;
  /**
   * The customization options for the service.
   */
  protected readonly _options: EnsureBearerTokenOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor({
    inject: { HTTPError, statuses },
    ...options
  }: EnsureBearerConstructorOptions) {
    this._HTTPError = HTTPError;
    this._options = deepAssignWithOverwrite(
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
   * Generates the middleware that verifies if a request has an `Authorization` header
   * with a bearer token.
   */
  getMiddleware(): ExpressMiddleware {
    return (req, res, next) => {
      let unauthorized = true;
      const {
        headers: { authorization },
      } = req;
      if (authorization) {
        const matches = this._options.expression.exec(authorization);
        if (matches) {
          const [, token] = matches;
          res.locals[this._options.local] = token;
          unauthorized = false;
        }
      }

      if (unauthorized) {
        const {
          error: { message, status, response },
        } = this._options;
        next(
          new this._HTTPError(message, status, {
            response,
          }),
        );
      } else {
        next();
      }
    };
  }
  /**
   * The customization options.
   */
  get options(): Readonly<EnsureBearerTokenOptions> {
    return deepAssignWithOverwrite({}, this._options);
  }
}
/**
 * Generates a "service middleware" that can be used on route controllers in order to
 * validate the presence of a bearer token on the requests authorization header.
 *
 * The registered service is an instance of {@link EnsureBearerToken}, and it uses the key
 * `ensureBearerToken`.
 *
 * Since it's a "provider creator", when registering it, you can pass custom options.
 *
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   // Register it on the container
 *   container.register(ensureBearerTokenProvider);
 *
 *   // Let's assume we are in a controller now...
 *   // Getting access to the middleware.
 *   const ensureBearerToken = container.get<ExpressMiddleware>('ensureBearerToken');
 *
 * @example
 *
 * <caption>Customizing the service</caption>
 *
 *   // Register it on the container
 *   container.register(
 *     ensureBearerTokenProvider({
 *       serviceName: 'ensureBearerTokenCustom',
 *       error: {
 *         message: 'Missing token!',
 *       },
 *     }),
 *   );
 *
 * @group Providers
 * @group Services/EnsureBearerToken
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
        }).getMiddleware(),
      );
    },
);
