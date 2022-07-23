import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { middlewareCreator, type Statuses } from '../../utils';
import type {
  DeepPartial,
  SimpleLogger,
  ExpressErrorHandler,
  SimpleConfig,
} from '../../types';
import { AppError, type HTTPErrorClass, type ResponsesBuilder } from '../../services';

export type ErrorHandlerResponseOptions = {
  message: string;
  status: number;
};

export type ErrorHandlerBaseOptions = {
  showErrors: boolean;
  response: ErrorHandlerResponseOptions;
};

export type ErrorHandlerPartialOptions = DeepPartial<ErrorHandlerBaseOptions>;

export type ErrorHandlerConstructorOptions = ErrorHandlerPartialOptions & {
  inject: {
    logger: SimpleLogger;
    responsesBuilder: ResponsesBuilder;
    statuses: Statuses;
    HTTPError: HTTPErrorClass;
  };
};

export type ErrorHandlerResponse = {
  error: boolean;
  message: string;
  stack?: string[];
} & Record<string, unknown>;

export class ErrorHandler {
  protected readonly logger: SimpleLogger;
  protected readonly responsesBuilder: ResponsesBuilder;
  protected readonly statuses: Statuses;
  protected readonly HTTPError: HTTPErrorClass;
  protected readonly options: ErrorHandlerBaseOptions;
  constructor({
    inject: { logger, responsesBuilder, statuses, HTTPError },
    ...options
  }: ErrorHandlerConstructorOptions) {
    this.logger = logger;
    this.responsesBuilder = responsesBuilder;
    this.statuses = statuses;
    this.HTTPError = HTTPError;
    this.options = deepAssignWithOverwrite(
      {
        showErrors: false,
        response: {
          message: 'Unexpected error',
          status: this.statuses('internal server error'),
        },
      },
      options,
    );
  }

  getOptions(): Readonly<ErrorHandlerBaseOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  middleware(): ExpressErrorHandler {
    return (err, _, res, next) => {
      if (!err) {
        next();
        return;
      }

      const { response, showErrors } = this.options;

      let { status } = response;
      let data: ErrorHandlerResponse = {
        error: true,
        message: response.message,
      };

      const knownError = err instanceof AppError;
      if (showErrors || knownError) {
        data.message = err.message;
        if (knownError) {
          data = {
            ...data,
            ...err.getResponse(),
          };
          status = err.status || (this.statuses('bad request') as number);
        }

        if (showErrors && err instanceof Error && err.stack) {
          const stack = err.stack.split('\n').map((line) => line.trim());
          data.stack = stack;
          stack.splice(0, 1);
          this.logger.error(`ERROR: ${err.message}`);
          this.logger.info(stack);
        }
      }

      this.responsesBuilder.json({
        res,
        data,
        status,
      });
    };
  }
}

export const errorHandlerMiddleware = middlewareCreator(
  (options: ErrorHandlerPartialOptions = {}) =>
    (app) => {
      const showErrors =
        app.get<SimpleConfig>('config').get<boolean | undefined>('debug.showErrors') ===
        true;
      return new ErrorHandler({
        inject: {
          logger: app.get('logger'),
          responsesBuilder: app.get('responsesBuilder'),
          statuses: app.get('statuses'),
          HTTPError: app.get('HTTPError'),
        },
        showErrors,
        ...options,
      }).middleware();
    },
);
