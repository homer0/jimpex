const ObjectUtils = require('wootils/shared/objectUtils');
const mime = require('mime');
const { controllerCreator } = require('../../utils/wrappers');
/**
 * Since the static files are inside a folder and we can't have the the `static` middleware pointing
 * to the app root directory, this service allows you to serve static files that are on the root
 * directory.
 */
class RootStaticsController {
  /**
   * Class constructor.
   * @param {SendFile} sendFile                             To be able to send the files as
   *                                                        responses.
   * @param {Array}   [files=['index.html', 'favicon.ico']] The list of files to serve. Each item
   *                                                        can be a `string` or an `Object` with
   *                                                        the keys `origin` for the file route,
   *                                                        `output` for the file location
   *                                                        relative to the root, and `headers`
   *                                                        with the file custom headers for the
   *                                                        response.
   */
  constructor(sendFile, files = ['index.html', 'favicon.ico']) {
    /**
     * A local reference for the `sendFile` service.
     * @type {SendFile}
     * @access protected
     * @ignore
     */
    this._sendFile = sendFile;
    /**
     * A dictionary with the file names as keys and information about the files as  values.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._files = this._parseFiles(files);
  }
  /**
   * Gets the list of files the service will serve.
   * @return {Array}
   */
  getFileEntries() {
    return Object.keys(this._files);
  }
  /**
   * Generates a middleware to serve an specific file.
   * @param {string} file The name of the file.
   * @return {ExpressMiddleware}
   * @throws {Error} If the file wasn't sent on the constructor.
   */
  serveFile(file) {
    if (!this._files[file]) {
      throw new Error(`The required static file doesn't exist (${file})`);
    }

    return (req, res, next) => {
      const item = this._files[file];
      const extension = item.output.split('.').pop().toLowerCase();
      const baseHeaders = { 'Content-Type': mime.getType(extension) };
      const headers = ObjectUtils.merge(baseHeaders, item.headers);

      Object.keys(headers).forEach((headerName) => {
        res.setHeader(headerName, headers[headerName]);
      });

      this._sendFile(res, item.output, next);
    };
  }
  /**
   * Parses and format the list of received files into a dictionary with the names of the files as
   * keys and the information about them as values.
   * @param {Array} files The list of files. Each item can be a `string` or an `Object` with the
   *                      keys `origin` for the file route, `output` for the file location relative
   *                      to the root, and `headers` with the file custom headers for the response.
   * @return {Object}
   */
  _parseFiles(files) {
    const formattedFiles = {};
    files.forEach((file) => {
      const item = {
        origin: '',
        output: '',
        headers: {},
      };

      if (typeof file === 'object') {
        item.origin = file.origin;
        item.output = file.output;
        item.headers = file.headers || {};
      } else {
        item.origin = file;
        item.output = file;
      }

      formattedFiles[item.origin] = item;
    });

    return formattedFiles;
  }
}
/**
 * This controller can be used to serve files from the root directory; the idea is to avoid
 * declaring the root directory as a static folder.
 * The files are sent to {@link RootStaticsController} and for each file, it will declare a route
 * and mount a middleware in order to serve them.
 * @type {ControllerCreator}
 * @param {Array} files The list of files. Each item can be a `string` or an `Object` with the
 *                      keys `origin` for the file route, `output` for the file location relative
 *                      to the root, and `headers` with the file custom headers in case they are
 *                      needed on the response.
 */
const rootStaticsController = controllerCreator((files) => (app) => {
  const router = app.get('router');
  const ctrl = new RootStaticsController(app.get('sendFile'), files);
  return ctrl.getFileEntries()
  .map((file) => router.all(`/${file}`, ctrl.serveFile(file)));
});

module.exports = {
  RootStaticsController,
  rootStaticsController,
};
