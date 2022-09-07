import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { middlewareCreator, type Statuses } from '../../utils';
import type { DeepPartial, Logger, ExpressErrorHandler, Config } from '../../types';
import { AppError, type HTTPErrorClass, type ResponsesBuilder } from '../../services';
/**
 * The options for the responses the middleware will create.
 *
 * @group Middlewares/ErrorHandler
 */
export type ErrorHandlerResponseOptions = {
  /**
   * The message to show in case `showErrors` is set to `false`.
   *
   * @default 'Oops! Something went wrong, please try again'
   * @prettierignore
   */
  message: string;
  /**
   * The default status code for the responses.
   *
   * @default 500
   */
  status: number;
};
/**
 * The customization options for the middleware.
 *
 * @group Middlewares/ErrorHandler
 */
export type ErrorHandlerOptions = {
  /**
   * If `false`, unknown errors will show a generic message instead of real message. And
   * if `true`, it will not only show all kind of errors but it will also show the error
   * stack.
   *
   * By "uknown errors", it means that are not `AppError` nor `HTTPError`.
   */
  showErrors: boolean;
  /**
   * The options for the default response the middleware will create.
   */
  response: ErrorHandlerResponseOptions;
};
/**
 * A partial version of the {@link ErrorHandlerOptions}, to be used in the constructor and
 * the middleware creator.
 *
 * @group Middlewares/ErrorHandler
 */
export type ErrorHandlerPartialOptions = DeepPartial<ErrorHandlerOptions>;
/**
 * The options to construct a {@link ErrorHandler}.
 *
 * @group Middlewares/ErrorHandler
 */
export type ErrorHandlerConstructorOptions = ErrorHandlerPartialOptions & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    logger: Logger;
    responsesBuilder: ResponsesBuilder;
    statuses: Statuses;
    HTTPError: HTTPErrorClass;
  };
};
/**
 * Creates a middleware that handles errors and generates the responses.
 *
 * @group Middleware Classes
 * @group Middlewares/ErrorHandler
 * @prettierignore
 */
export class ErrorHandler {
  /**
   * The service that will log the messages in the console.
   */
  protected readonly _logger: Logger;
  /**
   * The service to generate the responses.
   */
  protected readonly _responsesBuilder: ResponsesBuilder;
  /**
   * The uility service to get HTTP status codes.
   */
  protected readonly _statuses: Statuses;
  /**
   * The Error class used by the "known errors".
   */
  protected readonly _HTTPError: HTTPErrorClass;
  /**
   * The customization options.
   */
  protected readonly _options: ErrorHandlerOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor({
    inject: { logger, responsesBuilder, statuses, HTTPError },
    ...options
  }: ErrorHandlerConstructorOptions) {
    this._logger = logger;
    this._responsesBuilder = responsesBuilder;
    this._statuses = statuses;
    this._HTTPError = HTTPError;
    this._options = deepAssignWithOverwrite(
      {
        showErrors: false,
        response: {
          message: 'Unexpected error',
          status: this._statuses('internal server error'),
        },
      },
      options,
    );
  }
  /**
   * Generates the middleware that handles the errors.
   */
  getMiddleware(): ExpressErrorHandler {
    return (err, _, res, next) => {
      // If there wasn't any error, continue the execution.
      if (!err) {
        next();
        return;
      }

      const { response, showErrors } = this._options;

      // Define the base status and response.
      let { status } = response;
      let data: {
        error: boolean;
        message: string;
        stack?: string[];
      } & Record<string, unknown> = {
        error: true,
        message: response.message,
      };

      const knownError = err instanceof AppError;
      // If it's a "known error" or the `showErrors` flag is set to `true`...
      if (showErrors || knownError) {
        // Get the real message.
        data.message = err.message;
        // If it's a "known error"...
        if (knownError) {
          // Try to extract information for the response.
          data = {
            ...data,
            ...err.getResponse(),
          };
          status = err.status || (this._statuses('bad request') as number);
        }
        /**
         * If the flag is set to `true`, and it's a "valid error", try to extract the
         * stack, format it, and include it in the response.
         */
        if (showErrors && err instanceof Error && err.stack) {
          const stack = err.stack.split('\n').map((line) => line.trim());
          data.stack = stack;
          stack.splice(0, 1);
          this._logger.error(`ERROR: ${err.message}`);
          this._logger.info(stack);
        }
      }

      this._responsesBuilder.json({
        res,
        data,
        status,
      });
    };
  }
  /**
   * The handler customization options.
   */
  get options(): Readonly<ErrorHandlerOptions> {
    return deepAssignWithOverwrite({}, this._options);
  }
}
/**
 * Creates the middleware that handles errors.
 *
 * @group Middlewares
 * @group Middlewares/ErrorHandler
 */
export const errorHandlerMiddleware = middlewareCreator(
  (options: ErrorHandlerPartialOptions = {}) =>
    (app) => {
      const showErrors =
        app.get<Config>('config').get<boolean | undefined>('debug.showErrors') === true;
      return new ErrorHandler({
        inject: {
          logger: app.get('logger'),
          responsesBuilder: app.get('responsesBuilder'),
          statuses: app.get('statuses'),
          HTTPError: app.get('HTTPError'),
        },
        showErrors,
        ...options,
      }).getMiddleware();
    },
);
