const { provider } = require('../../utils/wrappers');
/**
 * A simple subclass of `Error` but with support for context information.
 * @extends {Error}
 */
class AppError extends Error {
  /**
   * @param {string}  message      The error message.
   * @param {Object}  [context={}] Context information related to the error.
   */
  constructor(message, context = {}) {
    super(message);

    // Limit the stack trace if possible.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Context information related to the error.
     * @type {Object}
     * @access protected
     */
    this._context = Object.freeze(context);
    /**
     * The date of when the error was generated.
     * @type {Date}
     * @access protected
     */
    this._date = new Date();
    /**
     * Overwrite the name of the `Error` with the one from the class.
     * @ignore
     */
    this.name = this.constructor.name;
  }
  /**
   * Context information related to the error.
   * @return {Object}
   */
  get context() {
    return this._context;
  }
  /**
   * The date of when the error was generated.
   * @return {Date}
   */
  get date() {
    return this._date;
  }
  /**
   * Information about the error that can be shown on an app response. This is set using the
   * `response` key on the `context`. The idea is that the error handler will read it and use it
   * on the response.
   * @return {Object}
   */
  get response() {
    return this._context.response || {};
  }
  /**
   * An HTTP status code related to the error. This is set using the `status` key on the
   * `context`. If the error handler finds it, it will use it as the response status.
   * and use it if necessary.
   * @return {?number}
   */
  get status() {
    return this._context.status || null;
  }
}
/**
 * A generator function to create {@link AppError} instances.
 * @param {string} message   The error message.
 * @param {Object} [context] Context information related to the error.
 */
const appErrorGenerator = (message, context) => new AppError(message, context);
/**
 * A service provider that will register both the {@link AppError} and a generator function on
 * the container. `AppError` will be the key for class, and `appError` will be for the
 * generator function.
 * @example
 * // Register it on the container
 * container.register(appError);
 * // Getting access to the class.
 * const AppError = container.get('AppError');
 * // Getting access to the function.
 * const appError = container.get('appError');
 * @type {Provider}
 */
const appError = provider((app) => {
  app.set('AppError', () => AppError);
  app.set('appError', () => appErrorGenerator);
});

module.exports = {
  AppError,
  appError,
};
