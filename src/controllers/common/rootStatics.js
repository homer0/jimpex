const extend = require('extend');
const mime = require('mime');
const { controller } = require('../../utils/wrappers');
/**
 * Since the static files are inside a folder and we can't have the the `static` middleware pointing
 * to the app root directory, this service allows you to serve static files that are on the root
 * directory.
 */
class RootStaticsController {
  /**
   * Class constructor.
   * @param {SendFile} sendFile                              To be able to send the files as
   *                                                         responses.
   * @param {Array}   [files=['index.html', 'favicon.icon']] The list of files to serve. Each item
   *                                                         can be a `string` or an `Object` with
   *                                                         the keys `origin` for the file route,
   *                                                         `output` for the file location
   *                                                         relative to the root, and `headers`
   *                                                         with the file custom headers for the
   *                                                         response.
   */
  constructor(sendFile, files = ['index.html', 'favicon.icon']) {
    /**
     * A local reference for the `sendFile` service.
     * @type {SendFile}
     */
    this.sendFile = sendFile;
    /**
    * A dictionary with the file names as keys and information about the files as values.
    * @type {Object}
    */
    this.files = this._parseFiles(files);
  }
  /**
   * Gets the list of files the service will serve.
   * @return {Array}
   */
  getFileEntries() {
    return Object.keys(this.files);
  }
  /**
   * Generates a middleware to serve an specific file.
   * @param {string} file The name of the file.
   * @return {ExpressMiddleware}
   * @throws {Error} If the file wasn't sent on the constructor.
   */
  serveFile(file) {
    if (!this.files[file]) {
      throw new Error(`The required static file doesn't exist (${file})`);
    }

    return (req, res, next) => {
      const item = this.files[file];
      const extension = item.output.split('.').pop().toLowerCase();
      const baseHeaders = { 'Content-Type': mime.getType(extension) };
      const headers = extend(true, baseHeaders, item.headers);

      Object.keys(headers).forEach((headerName) => {
        res.setHeader(headerName, headers[headerName]);
      });

      this.sendFile(res, item.output, next);
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
 * Generates a controller with an already defined list of files.
 * The controller will get all the files, add route for each one of them and include a middleware
 * provided by the `RootStaticsController` in order to serve them.
 * @param {Array} files The list of files. Each item can be a `string` or an `Object` with the
 *                      keys `origin` for the file route, `output` for the file location relative
 *                      to the root, and `headers` with the file custom headers for the response.
 * @return {Controller}
 */
const rootStaticsControllerCustom = (files) => controller((app) => {
  const router = app.get('router');
  const ctrl = new RootStaticsController(app.get('sendFile'), files);
  return ctrl.getFileEntries()
  .map((file) => router.all(`/${file}`, ctrl.serveFile(file)));
});
/**
 * Mount a controller to serve an `index.html` and `favicon.ico` files from the root directory.
 * @type {Controller}
 */
const rootStaticsController = rootStaticsControllerCustom();

module.exports = {
  RootStaticsController,
  rootStaticsController,
  rootStaticsControllerCustom,
};
