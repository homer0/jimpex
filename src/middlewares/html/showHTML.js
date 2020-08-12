const mime = require('mime');
const { middlewareCreator } = require('../../utils/wrappers');

/**
 * @typedef {import('../../services/common/sendFile').SendFile} SendFile
 * @typedef {import('../../services/html/htmlGenerator').HTMLGenerator} HTMLGenerator
 */

/**
 * A set options to customize the middleware behavior.
 *
 * @typedef {Object} ShowHTMLMiddlewareOptions
 * @property {string} file          The name of the file the middleware will serve. Default
 *                                  `'index.html'`.
 * @property {string} htmlGenerator The name of a {@link HTMLGenerator} service for the middleware
 *                                  to use. If the service is available, the value of `file` will
 *                                  be overwritten for the file generated by the service. Default
 *                                  `'htmlGenerator'`.
 */

/**
 * A very simple middleware service to send an HTML on a server response. The special _'feature'_ of
 * this service is that it can be hooked up to an `HTMLGenerator` service and it will automatically
 * server the file generated by it.
 */
class ShowHTML {
  /**
   * @param {SendFile}      sendFile             Necessary to server the HTML file.
   * @param {string}        [file='index.html']  The name of the file it will serve. If
   *                                             `htmlGenerator` is specified, this will be
   *                                             overwritten with the name of the file generated by
   *                                             that service.
   * @param {HTMLGenerator} [htmlGenerator=null] If used, the file to server will be the one
   *                                             generated by that service.
   */
  constructor(sendFile, file = 'index.html', htmlGenerator = null) {
    /**
     * A local reference for the `sendFile` service.
     *
     * @type {SendFile}
     * @access protected
     * @ignore
     */
    this._sendFile = sendFile;
    /**
     * The name of the file to serve.
     *
     * @type {string}
     * @access protected
     * @ignore
     */
    this._file = file;
    /**
     * If specified, a reference for a service that generates HTML files.
     *
     * @type {HTMLGenerator}
     * @access protected
     * @ignore
     */
    this._htmlGenerator = htmlGenerator;
    /**
     * Whether or not the file is ready to be served.
     *
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._ready = true;
    // If an `HTMLGenerator` service was specified...
    if (this._htmlGenerator) {
      // ...get the name of the file from that service.
      this._file = this._htmlGenerator.getFile();
      /**
       * Mark the `_ready` flag as `false` as this service needs to wait for the generator to
       * create the file.
       */
      this._ready = false;
    }
  }
  /**
   * Returns the Express middleware that serves the HTML file.
   *
   * @returns {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      // If `_ready` is `false`
      if (!this._ready) {
        /**
         * It means that it's using the `HTMLGenerator` service, so it
         * calls the method that will notify this service when the file has been created and is
         * ready to be loaded.
         */
        this._htmlGenerator.whenReady()
        .then(() => {
          // The file is ready to use, so mark the `_ready` flag as `true`.
          this._ready = true;
          // Serve the file.
          this._sendHTML(res, next);
        })
        .catch((error) => {
          // Something happened while generating the file, send the error the next middlware.
          next(error);
        });
      } else {
        /**
         * If `_ready` is `true` it means that the `HTMLGenerator` has already created the file on
         * a previous request or it was never specified, so just serve the file.
         */
        this._sendHTML(res, next);
      }
    };
  }
  /**
   * The name of the file to serve.
   *
   * @type {string}
   */
  get file() {
    return this._file;
  }
  /**
   * Serves the file on the response.
   *
   * @param {ExpressResponse} res  The server response.
   * @param {ExpressNext}     next The functino to call the next middleware.
   * @access protected
   * @ignore
   */
  _sendHTML(res, next) {
    res.setHeader('Content-Type', mime.getType('html'));
    this._sendFile(res, this._file, next);
  }
}
/**
 * A middleware for showing an `index.html` file.
 *
 * @type {MiddlewareCreator<ShowHTMLMiddlewareOptions>}
 */
const showHTML = middlewareCreator((options = {}) => (app) => {
  const htmlGeneratorServiceName = typeof options.htmlGenerator === 'undefined' ?
    'htmlGenerator' :
    options.htmlGenerator;

  return (
    new ShowHTML(
      app.get('sendFile'),
      options.file,
      htmlGeneratorServiceName ? app.try(htmlGeneratorServiceName) : null,
    )
  ).middleware();
});

module.exports.ShowHTML = ShowHTML;
module.exports.showHTML = showHTML;
