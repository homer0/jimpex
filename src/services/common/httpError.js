const { code: statuses } = require('statuses');
const ObjectUtils = require('wootils/shared/objectUtils');
const { provider } = require('../../utils/wrappers');
const { AppError } = require('./appError');
/**
 * A type of error to be used on HTTP requests.
 *
 * @augments AppError
 * @parent module:services
 */
class HTTPError extends AppError {
  /**
   * @param {string} message       The error message.
   * @param {number} [status=200]  The HTTP status code of the request response.
   * @param {Object} [context={}]  Context information related to the error.
   */
  constructor(message, status = statuses.ok, context = {}) {
    super(message, ObjectUtils.merge({ status }, context));
  }
}
/**
 * A generator function to create {@link HTTPError} instances.
 *
 * @param {string} message    The error message.
 * @param {number} [status]   The HTTP status code of the request response.
 * @param {Object} [context]  Context information related to the error.
 * @returns {HTTPError}
 * @parent module:services
 */
const httpErrorGenerator = (message, status, context) =>
  new HTTPError(message, status, context);
/**
 * A service provider that will register both the {@link HTTPError} and a generator
 * function on the container. `HTTPError` will be the key for class, and `httpError` will
 * be for the generator function.
 *
 * @type {Provider}
 * @example
 *
 *   // Register it on the container
 *   container.register(httpError);
 *   // Getting access to the class.
 *   const HTTPError = container.get('HTTPError');
 *   // Getting access to the function.
 *   const httpError = container.get('httpError');
 *
 * @parent module:services
 */
const httpError = provider((app) => {
  app.set('HTTPError', () => HTTPError);
  app.set('httpError', () => httpErrorGenerator);
});

module.exports.HTTPError = HTTPError;
module.exports.httpError = httpError;
