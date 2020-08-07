const ObjectUtils = require('wootils/shared/objectUtils');
const { code: statuses } = require('statuses');
const { middlewareCreator } = require('../../utils/wrappers');

/**
 * @typdef {Object} VersionValidatorLatestOptions
 * @description The options for how the middleware should behave if the requested version is
 *              `latest`.
 * @property {boolean} [allow=true]    Whether or not the middleware should validate the _"latest
 *                                     version"_.
 * @property {string}  [name='latest'] The name of the _"latest version"_. Basically,
 *                                     `req.params.version` must match with this property in order
 *                                     to be consider "latest".
 */

/**
 * @typdef {Object} VersionValidatorPopupOptions
 * @description The options for how to detect if the request comes from a popup and how to compose
 *              the post message the middleware will use to respond.
 * @property {string} [variable='popup']          The name of the query string variable the
 *                                                middleware will check in order to indentify
 *                                                whether the request comes from a popup or not.
 *                                                The variable must have `'true'` as its value.
 * @property {string} [title='Conflict']          The title of the page that will be generated to
 *                                                respond in case the versions don't match.
 * @property {string} [message='vesion:conflict'] The contents of the post message the generated
 *                                                page will send if the versions don't match.
 */

/**
 * @typedef {Object} VersionValidatorOptions
 * @description The options used to customize a {@link VersionValidator} instance.
 * @property {string}                        [error]   The error message to show when the version
 *                                                     is invalid.
 * @property {VersionValidatorLatestOptions} [latest]  The options for how the middleware should
 *                                                     behave if the requested version is
 *                                                     `latest`.
 * @property {VersionValidatorPopupOptions}  [popup]   The options for how to detect if the request
 *                                                     comes from a popup and how to compose the
 *                                                     post message the middleware will use to
 *                                                     respond.
 * @property {string|number}                 [version] The version used to validate the requests.
 *                                                     On the {@link VersionValidator}
 *                                                     constructor, if specified via parameter,
 *                                                     the class will take care of automatically
 *                                                     add it to the options.
 */

/**
 * This is the handler for the middleware/controller that validates the app version.
 * This is useful in cases where you want to restrict the access to the app to specific versions,
 * for example: you have a frontend app which needs to be aligned with the "current" version of
 * the app, since the frontend won't realize a new version was released, the validator can be
 * used to let the frontend know.
 * Also, it can be configured to handle requests from popups, in which case, instead of generating
 * an error message, it will send a post message.
 */
class VersionValidator {
  /**
   * @param {?string|?number}         version          The current version of the app. The reason
   *                                                   this is nullable is because this comes
   *                                                   directly from the app configuration, but
   *                                                   you may want to re use this to validate
   *                                                   "another version", so you can use the
   *                                                   custom shorthand and send the version using
   *                                                   the `options` parameter.
   * @param {ResponsesBuilder}        responsesBuilder To generate post message responses for
   *                                                   popups.
   * @param {Class}                   AppError         To generate the error in case the version is
   *                                                   invalid.
   * @param {VersionValidatorOptions} [options={}]     Custom options to modify the middleware
   *                                                   behavior.
   * @throws {Error} If the version is `null` and the `options` don't include one either.
   */
  constructor(
    version,
    responsesBuilder,
    AppError,
    options = {},
  ) {
    /**
     * A local reference for the `responsesBuilder` service.
     * @type {ResponsesBuilder}
     * @access protected
     * @ignore
     */
    this._responsesBuilder = responsesBuilder;
    /**
     * A local reference for the class the app uses to generate errors.
     * @type {Class}
     * @access protected
     * @ignore
     */
    this._AppError = AppError;
    /**
     * These are the "settings" the middleware will use in order to validate the requests.
     * @type {VersionValidatorOptions}
     * @access protected
     * @ignore
     */
    this._options = ObjectUtils.merge(
      {
        error: 'The application version doesn\'t match',
        latest: {
          allow: true,
          name: 'latest',
        },
        popup: {
          variable: 'popup',
          title: 'Conflict',
          message: 'vesion:conflict',
        },
        version,
      },
      options,
    );

    if (!this._options.version) {
      throw new Error('You need to supply a version');
    }
  }
  /**
   * Returns the Express middleware that will validate the `version` parameter.
   * @return {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      // Get the `version` parameter from the request.
      const { version } = req.params;
      if (!version) {
        // If no version is present, move on to the next middleware.
        next();
      } else if (version === this._options.version || this._validateLatest(version)) {
        /**
         * If the version matches the one on the options, or the requested version is "latest"
         * (and the option is enabled), move on to the next middleware.
         */
        next();
      } else if (this._isPopup(req)) {
        /**
         * If it doesn't match and the request is comming from a popup, send a response with a
         * post message.
         */
        this._responsesBuilder.htmlPostMessage(
          res,
          this._options.popup.title,
          this._options.popup.message,
          statuses.conflict,
        );
      } else {
        // Finally, if it doesn't match and is not from a popup, move to the error handler.
        next(new this._AppError(
          this._options.error,
          {
            status: statuses.conflict,
            response: {
              validation: true,
            },
          },
        ));
      }
    };
  }
  /**
   * The options used to customize the middleware behavior.
   * @return {VersionValidatorOptions}
   */
  get options() {
    return this._options;
  }
  /**
   * Helper method that checks if the incoming request is from a popup.
   * @param {ExpressRequest} req The request information.
   * @return {Boolean}
   * @access protected
   * @ignore
   */
  _isPopup(req) {
    const popup = req.query[this._options.popup.variable];
    return !!(popup && popup.toLowerCase() === 'true');
  }
  /**
   * Helper method that checks if the "latest version" is enabled and if the given version is
   * "the latest" (comparing it with the option name).
   * @param {string|number} version The version to validate.
   * @return {Boolean}
   * @access protected
   * @ignore
   */
  _validateLatest(version) {
    return this._options.latest.allow && version === this._options.latest.name;
  }
}
/**
 * A middleware that will validate a `version` request parameter against the app version and
 * generate an error if they don't match.
 * This is a "middleware/controller" is because the wrappers for both are the same, the
 * difference is that, for controllers, Jimpex sends a second parameter with the route where they
 * are mounted.
 * By validating the route parameter, the function can know whether the implementation is going
 * to use the middleware by itself or as a route middleware.
 * If used as middleware, it will just return the result of {@link VersionValidator#middleware};
 * but if used as controller, it will mount it on `[route]/:version/*`.
 * @type {MiddlewareCreator}
 * @param {VersionValidatorOptions} [options] Custom options to modify the middleware behavior.
 */
const versionValidator = middlewareCreator((options) => (app, route) => {
  // Get the middleware function.
  const middlewareValidator = (new VersionValidator(
    app.get('appConfiguration').get('version'),
    app.get('responsesBuilder'),
    app.get('AppError'),
    options,
  )).middleware();
  // Set the variable to be returned.
  let result;
  if (route) {
    // If the implementation will use it as a router, get the `router` service and mount it.
    const router = app.get('router');
    // Set the array of "routes" as the return value.
    result = [
      router.all('/:version/*', middlewareValidator),
    ];
  } else {
    // If the implementation will use it stand alone, just set the function to be returned.
    result = middlewareValidator;
  }

  // Return the route or the middleware.
  return result;
});

module.exports = {
  VersionValidator,
  versionValidator,
};
