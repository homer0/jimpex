const path = require('path');
const ObjectUtils = require('wootils/shared/objectUtils');
const mime = require('mime');
const { controllerCreator } = require('../../utils/wrappers');
const { removeSlashes } = require('../../utils/functions');

/**
 * @typdef {Object} StaticsControllerFile
 * @description If you wan to customize how, to, and from where files are served, instead of just
 *              sending a list of strings, you can use an object with these properties.
 * @property {string} route   The route the controller will use for the file.
 * @property {string} path    The path for the file, relative to the root of the app.
 * @property {Object} headers A dictionary of custom headers to send on the file response.
 */

/**
 * @typedef {Object} StaticsControllerPathsOptions
 * @description They are like "master paths" that get prepended to all the file paths and routes
 *              the controller use.
 * @property {string} route  A custom route to prefix all the file routes.
 * @property {string} source A custom path to prefix all the file paths.
 */

/**
 * @typdef {Object} StaticsControllerOptions
 * @description These are the options that allow you to customize the controller, how, to and from
 *              where the files are served.
 * @property {Array}                         files   A list of filenames or
 *                                                   {@link StaticsControllerFile} definitions.
 * @property {Object}                        methods A dictionary of all the HTTP methods the
 *                                                   controller will use in order to serve the
 *                                                   files. If `all` is set to true, all the other
 *                                                   flags will be ignored.
 * @property {StaticsControllerPathsOptions} paths   The "master paths" the controller uses to
 *                                                   prefix all file routes and paths.
 */

/**
 * This controller allows you to serve specific files from any folder to any route without the
 * need of mounting directories as "static".
 */
class StaticsController {
  /**
   * @param {SendFile}                 sendFile To send the responses for the files.
   * @param {StaticsControllerOptions} options  The options to customize the controller.
   */
  constructor(sendFile, options = {}) {
    /**
     * A local reference for the `sendFile` service.
     * @type {SendFile}
     * @access protected
     * @ignore
     */
    this._sendFile = sendFile;
    /**
     * The controller configuration options.
     * @type {StaticsControllerOptions}
     * @access protected
     * @ignore
     */
    this._options = this._normalizeOptions(ObjectUtils.merge(
      {
        files: options.files || ['favicon.ico', 'index.html'],
        methods: {
          all: false,
          get: true,
        },
        paths: {
          route: '',
          source: './',
        },
      },
      options,
    ));
    /**
     * A dictionary of all the formatted files ({@link StaticsControllerFile}). It uses the files
     * routes as keys.
     * @access protected
     * @ignore
     */
    this._files = this._createFiles();
  }
  /**
   * Defines all the needed routes to serve the files.
   * @param {ExpressRouter} router           To generate the routes.
   * @param {Array}         [middlewares=[]] A list of custom middlewares that will be added
   *                                         before the one that serves a file.
   * @return {ExpressRouter}
   */
  addRoutes(router, middlewares = []) {
    const { methods } = this._options;
    const use = methods.all ?
      ['all'] :
      Object.keys(methods).reduce((acc, name) => (methods[name] ? [...acc, name] : acc), []);

    Object.keys(this._files).forEach((route) => {
      const file = this._files[route];
      const fileMiddleware = this._getMiddleware(file);
      use.forEach((method) => this._addRoute(
        router,
        method,
        file,
        fileMiddleware,
        middlewares,
      ));
    });

    return router;
  }
  /**
   * The controller configuration options.
   * @type {StaticsControllerOptions}
   */
  get options() {
    return Object.freeze(this._options);
  }
  /**
   * Generates a route for an specific file.
   * @param {ExpressRouter}         router         To create the actual route.
   * @param {string}                method         The HTTP method for the route.
   * @param {StaticsControllerFile} file           The file information.
   * @param {ExpressMiddleware}     fileMiddleware The middleware that serves the file.
   * @param {Array}                 middlewares    A list of custom middlewares to add before the
   *                                               one that serves the file.
   * @return {ExpressRouter}
   * @access protected
   * @ignore
   */
  _addRoute(router, method, file, fileMiddleware, middlewares) {
    return router[method](file.route, [...middlewares, fileMiddleware]);
  }
  /**
   * Parses each of the received files in order to create a {@link StaticsControllerFile}.
   * @return {Object} A dictionary with the definitions as values and the routes as keys.
   * @access protected
   * @ignore
   */
  _createFiles() {
    const { files, paths } = this._options;
    const routePath = removeSlashes(paths.route, false, true);
    return files.reduce(
      (formatted, file) => {
        let source;
        let route;
        let headers;
        if (typeof file === 'object') {
          ({ route, source, headers } = file);
        } else {
          source = file;
          route = file;
        }

        source = path.join(paths.source, source);
        route = removeSlashes(route, true, false);
        route = `${routePath}/${route}`;

        return {
          ...formatted,
          [route]: {
            source,
            route,
            headers: headers || {},
          },
        };
      },
      {},
    );
  }
  /**
   * Generates the middleware to serve a specific file.
   * @param {StaticsControllerFile} file The file information.
   * @return {ExpressMiddleware}
   * @access protected
   * @ignore
   */
  _getMiddleware(file) {
    return (req, res, next) => {
      const extension = path.parse(file.source).ext.substr(1);
      const headers = ObjectUtils.merge(
        { 'Content-Type': mime.getType(extension) },
        file.headers,
      );

      Object.keys(headers).forEach((headerName) => {
        res.setHeader(headerName, headers[headerName]);
      });

      this._sendFile(res, file.source, next);
    };
  }
  /**
   * Helper method that validates and normalizes the options received by the controller.
   * @param {StaticsControllerOptions} options The options to validate.
   * @return {StaticsControllerOptions}
   * @throws {Error} If no files are specified.
   * @throws {Error} If methods is not defined.
   * @throws {Error} If no methods are enabled.
   * @throws {Error} If there's an invalid HTTP method.
   * @access protected
   * @ignore
   */
  _normalizeOptions(options) {
    if (!options.files || !options.files.length) {
      throw new Error('You need to specify a list of files');
    } else if (!options.methods) {
      throw new Error('You need to specify which HTTP methods are allowed for the files');
    }

    const methods = Object.keys(options.methods);

    const atLeastOne = methods.some((method) => options.methods[method]);
    if (!atLeastOne) {
      throw new Error('You need to enable at least one HTTP method to serve the files');
    }

    const allowedMethods = [
      'all',
      'get',
      'head',
      'post',
      'put',
      'delete',
      'connect',
      'options',
      'trace',
    ];

    const invalid = methods.find((method) => !allowedMethods.includes(method.toLowerCase()));
    if (invalid) {
      throw new Error(`${invalid} is not a valid HTTP method`);
    }

    const newMethods = methods.reduce(
      (acc, method) => ({
        ...acc,
        [method.toLowerCase()]: options.methods[method],
      }),
      {},
    );

    return {
      ...options,
      methods: newMethods,
    };
  }
}
/**
 * This controller allows you to serve specific files from any folder to any route without the
 * need of mounting directories as "static".
 * @type {ControllerCreator}
 * @param {StaticsControllerOptions} [options]     The options to customize the controller.
 * @param {Function():Array}         [middlewares] This function can be used to add custom
 *                                                 middlewares on the file routes. If implemented,
 *                                                 it must return a list of middlewares when
 *                                                 executed.
 */
const staticsController = controllerCreator((options, middlewares) => (app) => {
  const router = app.get('router');
  const ctrl = new StaticsController(app.get('sendFile'), options);
  let useMiddlewares;
  if (middlewares) {
    useMiddlewares = middlewares(app).map((middleware) => (
      middleware.connect ?
        middleware.connect(app) :
        middleware
    ));
  }

  return ctrl.addRoutes(router, useMiddlewares);
});

module.exports = {
  StaticsController,
  staticsController,
};
