import { provider, statuses as statusesFn, type Statuses } from '../../utils';
/**
 * A dictionary with some context information that can be provided to {@link AppError}.
 *
 * @group Services/AppError
 */
export type AppErrorContext = {
  /**
   * Extra information that the error handler can pick and include the response.
   */
  response?: unknown;
  /**
   * A status code or name for the error handler to set in the response.
   */
  status?: string | number;
} & Record<string, unknown>;
/**
 * A simple subclass of `Error` but with support for context information.
 *
 * @group Services
 * @group Services/AppError
 */
export class AppError extends Error {
  /**
   * The date of when the error was generated.
   */
  readonly date: Date;
  /**
   * The context information that can be provided to the error, and picked by the error
   * handler.
   */
  readonly context: AppErrorContext;
  /**
   * The service that generates HTTP status codes.
   */
  protected statuses: Statuses;
  /**
   * @param message   The message of the error.
   * @param context   The context information, for the error handler.
   * @param statuses  A reference to the service that generates HTTP status codes. This
   *                  is in case the implementation wants to use a special version from
   *                  the container; otherwise, it will use the `statuses` library
   *                  directly.
   */
  constructor(
    message: string,
    context: AppErrorContext = {},
    statuses: Statuses = statusesFn,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.date = new Date();
    this.statuses = statuses;
    this.context = this.parseContext(context);

    // Limit the stack trace if possible.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  /**
   * Gets an object that can be included in a response from the application. This method
   * is a helper for the `response` getter, as it allows for the assertion of the response
   * type.
   *
   * @template T  The type of the response.
   */
  getResponse<T>(): T {
    return this.response as T;
  }
  /**
   * Information about the error that can be included in a response. This is set using the
   * `response` key in the `context` option.
   */
  get response(): unknown {
    return this.context.response || {};
  }
  /**
   * An HTTP status code related to the error. This is set using the `status` key on the
   * `context`.
   */
  get status(): number | undefined {
    return this.context.status as number | undefined;
  }
  /**
   * Utility method that formats the context before saving it in the instance:
   * - If the context includes a `status` as a `string`, it will try to replace it with
   * its actual status code from the `statuses `service.
   *
   * @param context  The original context sent to the constructor.
   */
  protected parseContext(context: AppErrorContext): AppErrorContext {
    const result = { ...context };
    if (result.status && typeof result.status === 'string') {
      result.status = this.statuses.code[result.status.toLowerCase()] || result.status;
    }

    return result;
  }
}
/**
 * Shorthand for `new AppError()`.
 *
 * @param args  The same parameters as the {@link AppError} constructor.
 * @returns A new instance of {@link AppError}.
 * @group Services
 * @group Services/AppError
 */
export const createAppError = (
  ...args: ConstructorParameters<typeof AppError>
): AppError => new AppError(...args);
/**
 * The type of the function that generates a new instance of {@link AppError}.
 * This is exported to make it easy to type the dependency injection.
 *
 * @group Services/AppError
 */
export type CreateAppErrorFn = typeof createAppError;
/**
 * THe type of the {@link AppError} class.
 * This is exported to make it easy to type the dependency injection.
 *
 * @group Services/AppError
 */
export type AppErrorClass = typeof AppError;
/**
 * A service provider that will register both, {@link AppError} and
 * {@link createAppError}, on the container. `AppError` will be the key for class, and
 * `appError` will be for the generator function.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(appErrorProvider);
 *   // Getting access to the class.
 *   const AppError = container.get<AppErrorClass>('AppError');
 *   // Getting access to the function.
 *   const appError = container.get<CreateAppErrorFn>('appError');
 *
 * @group Providers
 * @group Services/AppError
 */
export const appErrorProvider = provider((app) => {
  app.set('AppError', () => AppError);
  app.set('appError', () => createAppError);
});
