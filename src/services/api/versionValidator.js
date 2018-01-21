const statuses = require('statuses');
const { provider } = require('../../utils/wrappers');
/**
 * This service provides a middleware to validate a `version` parameter on a route request by
 * comparing it with the app version.
 * This can be used to prevent frontend applications running with a different version of a Jimpex
 * server.
 * If the request includes a query string parameter named `popup` with the value of `true`, instead
 * of sending an error to the next middleware, it will respond with an HTML post message saying
 * `api:conflict`.
 * @todo change the post message and make it configurable.
 */
class VersionValidator {
  /**
   * Class constructor.
   * @param {AppConfiguration} appConfiguration To get the app version.
   * @param {ResponsesBuilder} responsesBuilder To generate the responses in case the received
   *                                            version is invalid.
   * @param {Class}            AppError         To generate the error in case the received version
   *                                            is invalid.
   */
  constructor(appConfiguration, responsesBuilder, AppError) {
    /**
     * A local reference for the `appConfiguration` service.
     * @type {AppConfiguration}
     */
    this.appConfiguration = appConfiguration;
    /**
     * A local reference for the `responsesBuilder` service.
     * @type {ResponsesBuilder}
     */
    this.responsesBuilder = responsesBuilder;
    /**
     * A local reference for the class the app uses to generate errors.
     * @type {Class}
     */
    this.AppError = AppError;
  }
  /**
   * Returns the Express middleware that validates the `version` parameter on a route.
   * @return {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      // Get the `version` parameter from the request.
      const reqVersion = req.params.version;
      // Get the `popup` parameter query string.
      const { popup } = req.query;
      // Check whether the response should be on an HTML, for a popup, or not.
      const isPopup = popup && popup === 'true';
      // If the version matches the one on the configuration, or the value is `latest`...
      if (
        reqVersion === 'latest' ||
        reqVersion === this.appConfiguration.get('version')
      ) {
        // ...move to the next middleware.
        next();
      } else if (isPopup) {
        // ...if it doesn't match but it's a popup, then respond with a post message.
        this.responsesBuilder.htmlPostMessage(
          res,
          'Conflict',
          'api:conflict',
          statuses.conflict
        );
      } else {
        // ...and if it doesn't match but it's not a popup, send an error to the next middleware.
        next(new this.AppError(
          'The API version and the client version are different',
          {
            status: statuses.conflict,
            response: {
              api: true,
            },
          }
        ));
      }
    };
  }
}
/**
 * The service provider that once registered on the app container will set the
 * `VersionValidator` middleware as the `versionValidator` service.
 * @example
 * // Register it on the container
 * container.register(versionValidator);
 * // Getting access to the middleware
 * const versionValidator = container.get('versionValidator');
 * @type {Provider}
 */
const versionValidator = provider((app) => {
  app.set('versionValidator', () => new VersionValidator(
    app.get('appConfiguration'),
    app.get('responsesBuilder'),
    app.get('appError')
  ).middleware());
});

module.exports = {
  VersionValidator,
  versionValidator,
};
