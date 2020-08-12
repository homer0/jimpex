const { middlewareCreator } = require('../../utils/wrappers');

/**
 * The options to customize the HSTS header value.
 *
 * @typedef {Object} HSTSOptions
 * @property {number}  [maxAge=31536000]        The time, in seconds, that the browser should
 *                                              remember that a site is only to be accessed using
 *                                              HTTPS.
 * @property {boolean} [includeSubDomains=true] Whether or not the rule should apply to all sub
 *                                              domains.
 * @property {boolea}  [preload=false]          Whether or not to include on the major browsers'
 *                                              preload list. This directive is not part of the
 *                                              specification, for more information about it, you
 *                                              should check the MDN documentation for the header.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
 */

/**
 * It configures a `Strict-Transport-Security` header and includes it on every response.
 *
 * @see https://tools.ietf.org/html/rfc6797
 */
class HSTS {
  /**
   * @param {Partial<HSTSOptions>} [options={}] The options to customize the header value.
   */
  constructor(options = {}) {
    /**
     * The value of the header that will be included on every response.
     *
     * @type {string}
     * @access protected
     * @ignore
     */
    this._header = this._buildHeader({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
      ...options,
    });
  }
  /**
   * Returns the Express middleware that includes the header on the response.
   *
   * @returns {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      res.setHeader('Strict-Transport-Security', this._header);
      next();
    };
  }
  /**
   * The value of the header that will be included on every response.
   *
   * @type {string}
   */
  get header() {
    return this._header;
  }
  /**
   * Creates the value for the header.
   *
   * @param {HSTSOptions} options The options to customize the header value.
   * @returns {string}
   * @access protected
   * @ignore
   */
  _buildHeader(options) {
    const directives = [`max-age=${options.maxAge}`];
    if (options.includeSubDomains) {
      directives.push('includeSubDomains');
    }

    if (options.preload) {
      directives.push('preload');
    }

    return directives.join('; ');
  }
}
/**
 * A middleware that creates and includes a `Strict-Transport-Security` header on every response.
 * If the `options` parameter doesn't include the value for `maxAge`, the middleware will ask
 * the {@link AppConfiguration} service for the `hsts` settings as a fallback. You can take
 * advantage of that fallback to use the middleware and manage its settings from your project
 * configuration.
 * Both the `options` parameter and the `hsts` can include a `enabled` (boolean) flag to either
 * disable or enable the middleware.
 *
 * @type {MiddlewareCreator<HSTSOptions>}
 */
const hsts = middlewareCreator((options = {}) => (app) => {
  const useOptions = typeof options.maxAge !== 'undefined' ?
    options :
    (app.get('appConfiguration').get('hsts') || {});

  return typeof useOptions.enabled === 'undefined' || useOptions.enabled ?
    (new HSTS(useOptions)).middleware() :
    null;
});

module.exports.HSTS = HSTS;
module.exports.hsts = hsts;
