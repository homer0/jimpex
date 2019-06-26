const statuses = require('statuses');
const ObjectUtils = require('wootils/shared/objectUtils');
const { providerCreator } = require('../../utils/wrappers');

/**
 * @typedef {Object} EnsureBearerTokenErrorOptions
 * @description These options allow you to modify the error generated by the middleware when the
 *              request doesn't have a valid token.
 * @property {string} [message='Unauthorized'] The error message for the response.
 * @property {number} [status=401]             The HTTP status that will be added to error context
 *                                             information.
 * @property {Object} [response={}]            Context information that the error handler can read
 *                                             and add to the default response.
 */

/**
 * @typedef {Object} EnsureBearerTokenOptions
 * @descriptions The options for how to validate the token and, possibly, create the errors.
 * @property {EnsureBearerTokenErrorOptions} [error]         The options to modify the error
 *                                                           generated by the middleware when the
 *                                                           request doesn't have a valid token.
 * @property {RegExp}                        [expression]    The regular expression used to
 *                                                           extract the token from the request
 *                                                           authorization header.
 * @property {string}                        [local='token'] The property inside the `res.locals`
 *                                                           where the token, if found, will be
 *                                                           saved.
 */

/**
 * This service gives you a middleware that verifies if a request has an `Authorization` header
 * with a bearer token; if it does, the token will be saved on the `res.locals`, otherwise, it
 * will generate an error.
 */
class EnsureBearerToken {
  /**
   * @param {Class}                     AppError     To format the error caused when the request
   *                                                 doesn't have a valid token.
   * @param {EnsureBearerTokenOptions}  [options={}] The options to customize the middleware
   *                                                 behavior: how to validate the token, how to
   *                                                 save it and what kind of error should
   *                                                 generate.
   */
  constructor(AppError, options = {}) {
    /**
     * A local reference for the class the app uses to generate errors.
     * @type {Class}
     * @access protected
     * @ignore
     */
    this._AppError = AppError;
    /**
     * The options that define how the middleware validates the token, saves it and generates
     * the possible error.
     * @type {EnsureBearerTokenOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge(
      {
        error: {
          message: 'Unauthorized',
          status: statuses.unauthorized,
          response: {},
        },
        expression: /bearer (.*?)(?:$|\s)/i,
        local: 'token',
      },
      options
    );
  }
  /**
   * Creates the middleware that will validate the presence of a bearer token on the request
   * authorization header.
   * @return {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      let unauthorized = true;
      const { headers: { authorization } } = req;
      if (authorization) {
        const matches = this._options.expression.exec(authorization);
        if (matches) {
          const [, token] = matches;
          res.locals[this._options.local] = token;
          unauthorized = false;
        }
      }

      if (unauthorized) {
        const { error } = this._options;
        next(new this._AppError(error.message, {
          status: error.status,
          response: error.response,
        }));
      } else {
        next();
      }
    };
  }
  /**
   * The options that define how the middleware validates the token, saves it and generates
   * the possible error.
   * @type {EnsureBearerTokenOptions}
   */
  get options() {
    return this._options;
  }
}
/**
 * Generates a "service middleware" that can be used on route controllers in order to validate
 * the presence of a bearer token on the requests authorization header.
 * @type {ProviderCreator}
 * @param {EnsureBearerTokenOptions} options The options to customize the middleware behavior: how
 *                                           to validate the token, how to save it and what kind
 *                                           of error should generate.
 */
const ensureBearerToken = providerCreator((options) => (app) => {
  app.set(
    'ensureBearerToken',
    () => (new EnsureBearerToken(app.get('AppError'), options)).middleware()
  );
});

module.exports = {
  EnsureBearerToken,
  ensureBearerToken,
};
