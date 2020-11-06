const ObjectUtils = require('wootils/shared/objectUtils');
const { code: statuses } = require('statuses');
const { middlewareCreator } = require('../../utils/wrappers');

/**
 * @typedef {import('../../services/http/responsesBuilder').ResponsesBuilder}
 * ResponsesBuilder
 */

/**
 * Before reading the recevied information, these will be the settings for the response.
 *
 * @typedef {Object} ErrorHandlerDefaultOptions
 * @property {string} message  The error message the response will show. Default `'Oops!
 *                             Something went wrong, please try again'`.
 * @property {number} status   The HTTP status code for the response. Default `500`.
 * @parent module:middlewares
 */

/**
 * The options for how to build the middleware responses.
 *
 * @typedef {Object} ErrorHandlerOptions
 * @property {ErrorHandlerDefaultOptions} default  The options to build the default
 *                                                 response,
 *                                                 before the middleware analyzes the
 *                                                 recevied error.
 * @parent module:middlewares
 */

/**
 * Provides the middleware to handle error responses for the app.
 *
 * @parent module:middlewares
 */
class ErrorHandler {
  /**
   * @param {Logger}              appLogger         To log the received errors.
   * @param {ResponsesBuilder}    responsesBuilder  To generate the JSON response.
   * @param {boolean}             showErrors        If `false`, unknown errors will show a
   *                                                generic message instead of real
   *                                                message. And if `true`,
   *                                                it will not only show all kind of
   *                                                errors but it will also show the error
   *                                                stack.
   * @param {ClassAppError}       AppError          To validate if the received errors are
   *                                                known or not.
   * @param {ErrorHandlerOptions} [options={}]      Custom options to modify the
   *                                                middleware behavior.
   */
  constructor(appLogger, responsesBuilder, showErrors, AppError, options = {}) {
    /**
     * A local reference for the `appLogger` service.
     *
     * @type {Logger}
     * @access protected
     * @ignore
     */
    this._appLogger = appLogger;
    /**
     * A local reference for the `responsesBuilder` service.
     *
     * @type {ResponsesBuilder}
     * @access protected
     * @ignore
     */
    this._responsesBuilder = responsesBuilder;
    /**
     * Whether or not to show unknown errors real messages.
     *
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._showErrors = showErrors;
    /**
     * A local reference for the class the app uses to generate errors.
     *
     * @type {ClassAppError}
     * @access protected
     * @ignore
     */
    this._AppError = AppError;
    /**
     * These are the "settings" the middleware will use in order to display the errors.
     *
     * @type {ErrorHandlerOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge(
      {
        default: {
          message: 'Oops! Something went wrong, please try again',
          status: statuses['internal server error'],
        },
      },
      options,
    );
  }
  /**
   * Returns the Express middleware that shows the errors.
   *
   * @returns {ExpressMiddleware}
   */
  middleware() {
    return (err, req, res, next) => {
      // If the middleware received an error...
      if (err) {
        // Define the error response basic template.
        let data = {
          error: true,
          message: this._options.default.message,
        };
        // Define the error response default status.
        let { status } = this._options.default;
        // Validate if the error is known or not.
        const knownError = err instanceof this._AppError;
        // If the `showErrors` flag is enabled or the error is a known error...
        if (this._showErrors || knownError) {
          // ...set the error real message on the response.
          data.message = err.message;
          // If the error type is known...
          if (knownError) {
            // Try to get any extra information that should be included on the response.
            data = Object.assign(data, err.response);
            // Try to obtain the response status from the error
            status = err.status || statuses['bad request'];
          }
          // If the `showErrors` flag is enabled...
          if (this._showErrors) {
            // Get the error stack and format it into an `Array`.
            const stack = err.stack.split('\n').map((line) => line.trim());
            //  Add the stack to the response.
            data.stack = stack;
            // Remove the first item of the stack, since it's the same as the message.
            stack.splice(0, 1);
            // Log the error.
            this._appLogger.error(`ERROR: ${err.message}`);
            this._appLogger.info(stack);
          }
        }
        // Send the response.
        this._responsesBuilder.json(res, data, status);
      } else {
        // ...otherwise, move to the next middleware.
        next();
      }
    };
  }
  /**
   * The options used to customize the middleware behavior.
   *
   * @returns {ErrorHandlerOptions}
   */
  get options() {
    return this._options;
  }
}
/**
 * Generates a middleware that show responses for unhandled errors thrown by the app.
 *
 * @type {MiddlewareCreator<ErrorHandlerOptions>}
 * @parent module:middlewares
 */
const errorHandler = middlewareCreator((options) => (app) => {
  const showErrors = app.get('appConfiguration').get('debug.showErrors') === true;
  return new ErrorHandler(
    app.get('appLogger'),
    app.get('responsesBuilder'),
    showErrors,
    app.get('AppError'),
    options,
  ).middleware();
});

module.exports.ErrorHandler = ErrorHandler;
module.exports.errorHandler = errorHandler;
