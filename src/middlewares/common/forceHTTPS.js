const { middlewareCreator } = require('../../utils/wrappers');
/**
 * @typedef {Object} ForceHTTPSMiddlewareOptions
 * @property {RegExp[]} ignoredRoutes A list of regular expressions to match routes that should be
 *                                    ignored.
 * @parent module:middlewares
 */

/**
 * Force all the app traffice to be through HTTPS.
 *
 * @parent module:middlewares
 */
class ForceHTTPS {
  /**
   * @param {RegExp[]} [ignoredRoutes=[/^\/service\//]] A list of regular expressions to match
   *                                                    routes that should be ignored.
   */
  constructor(ignoredRoutes = [/^\/service\//]) {
    /**
     * A list of regular expressions to match routes that should be ignored.
     *
     * @type {RegExp[]}
     * @access protected
     * @ignore
     */
    this._ignoredRoutes = ignoredRoutes;
  }
  /**
   * Returns the Express middleware that forces the redirection to HTTPS.
   *
   * @returns {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      if (
        !req.secure &&
        req.get('X-Forwarded-Proto') !== 'https' &&
        !this._ignoredRoutes.some((expression) => expression.test(req.originalUrl))
      ) {
        const host = req.get('Host');
        res.redirect(`https://${host}${req.url}`);
      } else {
        next();
      }
    };
  }
  /**
   * A list of regular expressions to match routes that should be ignored.
   *
   * @type {RegExp[]}
   */
  get ignoredRoutes() {
    return this._ignoredRoutes.slice();
  }
}
/**
 * A middleware to force HTTPS redirections to all the routes.
 *
 * @type {MiddlewareCreator<ForceHTTPSMiddlewareOptions>}
 * @parent module:middlewares
 */
const forceHTTPS = middlewareCreator((options = {}) => (app) => (
  app.get('appConfiguration').get('forceHTTPS') ?
    new ForceHTTPS(options.ignoredRoutes).middleware() :
    null
));

module.exports.ForceHTTPS = ForceHTTPS;
module.exports.forceHTTPS = forceHTTPS;
