import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { middlewareCreator, type Statuses } from '../../utils';
import {
  DeepPartial,
  Request,
  ExpressMiddleware,
  SimpleConfig,
  Router,
} from '../../types';
import type { HTTPErrorClass, ResponsesBuilder } from '../../services';
/**
 * The options for how the middleware should behave if the requested version is `latest`.
 */
export type VersionValidatorLatestOptions = {
  /**
   * Whether or not the middleware should validate the _"latest version"_.
   *
   * @default true
   */
  allow: boolean;
  /**
   * The name of the _"latest version"_. Basically, `req.params.version` must match with
   * this property in order to be consider "latest".
   *
   * @default 'latest'
   */
  name: string;
};
/**
 * The options for how to detect if the request comes from a popup and how to compose the
 * post message the middleware will use to respond.
 */
export type VersionValidatorPopupOptions = {
  /**
   * The name of the query string variable the middleware will check in order to indentify
   * whether the request comes from a popup or not. The variable must have `'true'` as its
   * value.
   *
   * @default 'popup'
   */
  variable: string;
  /**
   * The title of the page that will be generated to respond in case the versions don't
   * match.
   *
   * @default 'Conflict'
   */
  title: string;
  /**
   * The contents of the post message the generated page will send if the versions don't
   * match.
   *
   * @default 'version:conflict'
   */
  message: string;
};
/**
 * The options used to customize a {@link VersionValidator} instance.
 */
export type VersionValidatorOptions = {
  /**
   * The version used to validate the requests.
   */
  version: string;
  /**
   * The options for how the middleware should behave if the requested version is
   * `latest`.
   */
  latest: VersionValidatorLatestOptions;
  /**
   * The options for how to detect if the request comes from a popup and how to compose
   * the post message the middleware will use to respond.
   */
  popup: VersionValidatorPopupOptions;
  /**
   * The error message to show when the version is invalid.
   *
   * @default "The application version doesn't match"
   * @prettierignore
   */
  error: string;
};
/**
 * A partial version of the {@link VersionValidatorOptions}, to be used int he constructor
 * and the middleware creator. The reason it omits `version` it's because for the
 * constructor it's required, but for the middleware creator it's not.
 */
export type VersionValidatorPartialOptions = DeepPartial<
  Omit<VersionValidatorOptions, 'version'>
>;
/**
 * The options to construct a {@link VersionValidator}.
 */
export type VersionValidatorConstructorOptions = VersionValidatorPartialOptions & {
  /**
   * The version used to validate the requests.
   */
  version: string;
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    HTTPError: HTTPErrorClass;
    responsesBuilder: ResponsesBuilder;
    statuses: Statuses;
  };
};
/**
 * The options for the middleware creator that will mount an instance of
 * {@link VersionValidator}.
 */
export type VersionValidatorMiddlewareOptions = VersionValidatorPartialOptions & {
  /**
   * The version used to validate the requests. This is optional in here because if it's
   * not specified, it will be obtained from the configuration service.
   */
  version?: string;
};
/**
 * This is the handler for the middleware/controller that validates the application
 * version.
 * This is useful in cases where you want to restrict the access to specific versions; for
 * example: you have a frontend which needs to be aligned with the "current" version of
 * the application, since the frontend won't realize a new version was released, the
 * validator can be used to let the frontend know.
 * Also, it can be configured to handle requests from popups, in which case, instead of
 * generating an error message, it will send a post message.
 */
export class VersionValidator {
  /**
   * To generate the errors in case the validation fails.
   */
  protected readonly HTTPError: HTTPErrorClass;
  /**
   * To generate responses for popups.
   */
  protected readonly responsesBuilder: ResponsesBuilder;
  /**
   * The uility service to get HTTP status codes.
   */
  protected readonly statuses: Statuses;
  /**
   * The customization options.
   */
  protected readonly options: VersionValidatorOptions;
  /**
   * @param options  The options to construct the class.
   * @throws If no `version` is specified in the options.
   */
  constructor({ inject, version, ...options }: VersionValidatorConstructorOptions) {
    this.HTTPError = inject.HTTPError;
    this.responsesBuilder = inject.responsesBuilder;
    this.statuses = inject.statuses;
    this.options = deepAssignWithOverwrite(
      {
        error: "The application version doesn't match",
        latest: {
          allow: true,
          name: 'latest',
        },
        popup: {
          variable: 'popup',
          title: 'Conflict',
          message: 'vesion:conflict',
        },
        version,
      },
      options,
    );

    if (!this.options.version) {
      throw new Error('You need to supply a version');
    }
  }
  /**
   * Gets the customization options.
   */
  getOptions(): Readonly<VersionValidatorOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }
  /**
   * Generates the middleware that validates the version.
   */
  middleware(): ExpressMiddleware {
    return (req, res, next) => {
      // Get the `version` parameter from the request.
      const { version } = req.params;
      // If no version is present, move on to the next middleware.
      if (!version) {
        next();
        return;
      }
      // If the version matches, or it's a "latest" version, move on to the next middleware.
      if (version === this.options.version || this.isTheAllowedLatest(version)) {
        next();
        return;
      }

      const status = this.statuses('conflict');
      // If the request comes from a popup, send the post message.
      if (this.isPopup(req)) {
        const { title, message } = this.options.popup;
        this.responsesBuilder.htmlPostMessage({
          res,
          title,
          message,
          status,
        });
        return;
      }

      // Every other validation failed, and it's not a popup, so generate an error.
      next(
        new this.HTTPError(this.options.error, status, {
          response: {
            validation: true,
          },
        }),
      );
    };
  }
  /**
   * Helper method that checks if the incoming request is from a popup. It will look for
   * the query string variable defined in the constructor options.
   *
   * @param req  The request object sent by the application.
   */
  protected isPopup(req: Request): boolean {
    const popup = req.query[this.options.popup.variable];
    return !!(popup && String(popup).toLowerCase() === 'true');
  }
  /**
   * Helper method that checks if the "latest version" is enabled and if the given version
   * is "the latest" (comparing it with the option name).
   *
   * @param version  The version received in the request.
   */
  protected isTheAllowedLatest(version: string): boolean {
    const { allow, name } = this.options.latest;
    return allow && version === name;
  }
}
/**
 * A middleware that will validate a `version` request parameter against the application
 * version, and generate an error if they don't match.
 * This is a "middleware/controller" because the wrappers for both are the same, the
 * difference is that, for controllers, Jimpex sends a second parameter with the route
 * where they are mounted.
 * By validating the route parameter, the function can know whether the implementation is
 * going to use the middleware by itself or as a route middleware.
 * If used as middleware, it will just return the result of
 * {@link VersionValidator.middleware}; but if used as controller, it will mount it on
 * `[route]/:version/*`.
 */
export const versionValidatorMiddleware = middlewareCreator(
  (options: VersionValidatorMiddlewareOptions = {}) =>
    (app, route) => {
      const version = app.get<SimpleConfig>('config').get<string>('version');
      const middleware = new VersionValidator({
        inject: {
          HTTPError: app.get('HTTPError'),
          responsesBuilder: app.get('responsesBuilder'),
          statuses: app.get('statuses'),
        },
        version,
        ...options,
      }).middleware();

      if (route) {
        const router = app.get<Router>('router');
        return router.all('/:version/*', middleware);
      }

      return middleware;
    },
);
