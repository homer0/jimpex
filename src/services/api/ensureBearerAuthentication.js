const statuses = require('statuses');
const { provider } = require('../../utils/wrappers');
/**
 * This service provides a middleware that verifies if a request has a `Authorization` header
 * with a bearer token.
 * If a request has a valid bearer token, the middleware will set it as the `bearerToken` property
 * of the current request object.
 */
class EnsureBearerAuthentication {
  /**
   * Class constructor.
   * @param {Class} AppError To format the error caused when the request doesn't havve a valid
   *                         token.
   */
  constructor(AppError) {
    /**
     * A local reference for the class the app uses to generate errors.
     * @type {Class}
     */
    this.AppError = AppError;
    /**
     * The regular expression used to validate the token.
     * @type {RegExp}
     */
    this.bearerRegex = /bearer .+$/i;
  }
  /**
   * Returns the Express middleware that validates the `Authorization` header.
   * @return {ExpressMiddleware}
   * @todo Extract the token with the same RegExp used to validate.
   */
  middleware() {
    return (req, res, next) => {
      // Get the `Authorization` header.
      const { headers: { authorization } } = req;
      // If the header has content the RegExp says it's valid...
      if (authorization && this.bearerRegex.test(authorization)) {
        // ...Set the token as the `bearerToken` property of the current request.
        req.bearerToken = authorization.trim().split(' ').pop();
        // Move to the next middleware.
        next();
      } else {
        // ...otherwise, send an unauthorized error to the next middleware.
        next(new this.AppError('Unauthorized', {
          status: statuses.Unauthorized,
        }));
      }
    };
  }
}
/**
 * The service provider that once registered on the app container will set the
 * `EnsureBearerAuthentication` middleware as the `ensureBearerAuthentication` service.
 * @example
 * // Register it on the container
 * container.register(ensureBearerAuthentication);
 * // Getting access to the middleware
 * const ensureBearerAuthentication = container.get('ensureBearerAuthentication');
 * @type {Provider}
 */
const ensureBearerAuthentication = provider((app) => {
  app.set('ensureBearerAuthentication', () => new EnsureBearerAuthentication(
    app.get('AppError')
  ).middleware());
});

module.exports = {
  EnsureBearerAuthentication,
  ensureBearerAuthentication,
};
