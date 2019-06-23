const ObjectUtils = require('wootils/shared/objectUtils');
const statuses = require('statuses');
const { middleware } = require('../../utils/wrappers');

/**
 * @typedef {Object} ErrorHandlerDefaultOptions
 * @description Before reading the recevied information, these will be the settings for the
 *              response.
 * @property {string} [message='Oops! Something went wrong, please try again']
 * The error message the response will show.
 * @property {number} status
 * The HTTP status code for the response.
 */

/**
 * @typedef {Object} ErrorHandlerOptions
 * @description The options for how to build the middleware responses.
 * @property {ErrorHandlerDefaultOptions} default The options to build the default response,
 *                                                before the middleware analyzes the recevied
 *                                                error.
 */

/**
 * Provides the middleware to handle error responses for the app.
 */
class ErrorHandler {
  /**
   * Class constructor.
   * @param {Logger}              appLogger        To log the received errors.
   * @param {ResponsesBuilder}    responsesBuilder To generate the JSON response.
   * @param {Boolean}             showErrors       If `false`, unknown errors will show a generic
   *                                               message instead of real message. And if `true`,
   *                                               it will not only show all kind of errors but it
   *                                               will also show the error stack.
   * @param {Class}               AppError         To validate if the received errors are known or
   *                                               not.
   * @param {ErrorHandlerOptions} [options={}]     Custom options to modify the middleware
   *                                               behavior.
   */
  constructor(
    appLogger,
    responsesBuilder,
    showErrors,
    AppError,
    options = {}
  ) {
    /**
     * A local reference for the `appLogger` service.
     * @type {Logger}
     */
    this.appLogger = appLogger;
    /**
     * A local reference for the `responsesBuilder` service.
     * @type {ResponsesBuilder}
     */
    this.responsesBuilder = responsesBuilder;
    /**
     * Whether or not to show unknown errors real messages.
     * @type {Boolean}
     */
    this.showErrors = showErrors;
    /**
     * A local reference for the class the app uses to generate errors.
     * @type {Class}
     */
    this.AppError = AppError;
    /**
     * These are the "settings" the middleware will use in order to display the errors.
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
      options
    );
  }
  /**
   * Returns the Express middleware that shows the errors.
   * @return {ExpressMiddleware}
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
        const knownError = err instanceof this.AppError;
        // If the `showErrors` flag is enabled or the error is a known error...
        if (this.showErrors || knownError) {
          // ...set the error real message on the response.
          data.message = err.message;
          // If the error type is known...
          if (knownError) {
            // Try to get any extra information that should be included on the response.
            data = Object.assign(data, err.response);
            // Try to obtain the response status from the error
            status = err.status || statuses['Bad Request'];
          }
          // If the `showErrors` flag is enabled...
          if (this.showErrors) {
            // Get the error stack and format it into an `Array`.
            const stack = err.stack.split('\n').map((line) => line.trim());
            //  Add the stack to the response.
            data.stack = stack;
            // Remove the first item of the stack, since it's the same as the message.
            stack.splice(0, 1);
            // Log the error.
            this.appLogger.error(`ERROR: ${err.message}`);
            this.appLogger.info(stack);
          }
        }
        // Send the response.
        this.responsesBuilder.json(res, data, status);
      } else {
        // ...otherwise, move to the next middleware.
        next();
      }
    };
  }
  /**
   * The options used to customize the middleware behavior.
   * @return {ErrorHandlerOptions}
   */
  get options() {
    return this._options;
  }
}
/**
 * Generates a middleware that generates responses for unhandled errors thrown by the app.
 * @param {ErrorHandlerOptions} [options] Custom options to modify the middleware behavior.
 * @return {Middleware}
 */
const errorHandlerCustom = (options) => middleware((app) => {
  const debugging = app.get('appConfiguration').get('debug');
  const showErrors = debugging && debugging.showErrors;
  return new ErrorHandler(
    app.get('appLogger'),
    app.get('responsesBuilder'),
    showErrors,
    app.get('AppError'),
    options
  )
  .middleware();
});

/**
 * This middleware generates responses for unhandled errors thrown by the app.
 * @type {Middleware}
 */
const errorHandler = errorHandlerCustom();

module.exports = {
  ErrorHandler,
  errorHandler,
  errorHandlerCustom,
};
