const { middlewareCreator } = require('../../utils/wrappers');
/**
 * Force all the app traffice to be through HTTPS.
 */
class ForceHTTPS {
  /**
   * Class constructor.
   * @param {Array} [ignoredRoutes=[/^\/service\//]] A list of regular expressions to match routes
   *                                                 that should be ignored.
   */
  constructor(ignoredRoutes = [/^\/service\//]) {
    /**
     * A list of regular expressions to match routes that should be ignored.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._ignoredRoutes = ignoredRoutes;
  }
  /**
   * Returns the Express middleware that forces the redirection to HTTPS.
   * @return {ExpressMiddleware}
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
   * @type {Array}
   */
  get ignoredRoutes() {
    return this._ignoredRoutes.slice();
  }
}
/**
 * A middleware to force HTTPS redirections to all the routes.
 * @type {MiddlewareCreator}
 * @param {Array} ignoredRoutes A list of regular expressions to match routes that should be
 *                              ignored.
 */
const forceHTTPS = middlewareCreator((ignoredRoutes) => (app) => (
  app.get('appConfiguration').get('forceHTTPS') ?
    new ForceHTTPS(ignoredRoutes).middleware() :
    null
));

module.exports = {
  ForceHTTPS,
  forceHTTPS,
};
