const { middleware } = require('../../utils/wrappers');
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
     */
    this.ignoredRoutes = ignoredRoutes;
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
        !this.ignoredRoutes.some((expression) => expression.test(req.originalUrl))
      ) {
        const host = req.get('Host');
        res.redirect(`https://${host}${req.url}`);
      } else {
        next();
      }
    };
  }
}
/**
 * Generates a middleware with an already defined list of ignored routes expressions.
 * @param {Array} ignoredRoutes A list of regular expressions to match routes that should be
 *                              ignored.
 * @return {Middleware}
 */
const forceHTTPSCustom = (ignoredRoutes) =>
  middleware((app) => (
    app.get('appConfiguration').get('forceHTTPS') ?
      new ForceHTTPS(ignoredRoutes).middleware() :
      null
  ));
/**
 * A middleware to force HTTPS redirections to all the routes.
 * @type {Middleware}
 */
const forceHTTPS = forceHTTPSCustom();

module.exports = {
  ForceHTTPS,
  forceHTTPS,
  forceHTTPSCustom,
};
