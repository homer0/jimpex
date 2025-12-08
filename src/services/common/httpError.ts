import { provider, statuses as statusesFn, type Statuses } from '../../utils/index.js';
import { AppError, type AppErrorContext } from './appError.js';
/**
 * A type of error to be used on HTTP requests. This is the most common type of error used
 * by Jimpex.
 *
 * @group Services
 * @group Services/HTTPError
 */
export class HTTPError extends AppError {
  /**
   * @param message   The error message.
   * @param status    The HTTP status code.
   * @param context   Context information related to the error.
   * @param statuses  A reference to the service that generates HTTP status codes. This
   *                  is in case the implementation wants to use a special version from
   *                  the container; otherwise, it will use the `statuses` library
   *                  directly.
   */
  constructor(
    message: string,
    status: number | string = statusesFn('ok'),
    context: AppErrorContext = {},
    statuses: Statuses = statusesFn,
  ) {
    super(message, { ...context, status }, statuses);
  }
}
/**
 * Shorthand for `new HTTPError()`.
 *
 * @param args  The same parameters as the {@link HTTPError} constructor.
 * @returns A new instance of {@link HTTPError}.
 * @group Services
 * @group Services/HTTPError
 */
export const createHTTPError = (
  ...args: ConstructorParameters<typeof HTTPError>
): HTTPError => new HTTPError(...args);
/**
 * The type of the function that generates a new instance of {@link HTTPError}.
 * This is exported to make it easy to type the dependency injection.
 *
 * @group Services/HTTPError
 */
export type CreateHTTPErrorFn = typeof createHTTPError;
/**
 * THe type of the {@link HTTPError} class.
 * This is exported to make it easy to type the dependency injection.
 *
 * @group Services/HTTPError
 */
export type HTTPErrorClass = typeof HTTPError;
/**
 * A service provider that will register both the {@link HTTPError} and a generator
 * function on the container. `HTTPError` will be the key for class, and `httpError` will
 * be for the generator function.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(httpErrorProvider);
 *   // Getting access to the class.
 *   const HTTPError = container.get<HTTPErrorClass>('HTTPError');
 *   // Getting access to the function.
 *   const httpError = container.get<CreateHTTPErrorFn>('httpError');
 *
 * @group Providers
 * @group Services/HTTPError
 */
export const httpErrorProvider = provider((app) => {
  app.set('HTTPError', () => HTTPError);
  app.set('httpError', () => createHTTPError);
});
