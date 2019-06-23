const mime = require('mime');
const ObjectUtils = require('wootils/shared/objectUtils');
const { eventNames } = require('../../constants');
const { middlewareCreator } = require('../../utils/wrappers');

/**
 * @typedef {Object} FastHTMLOptions
 * @description The options to customize the behavior of the middleware.
 * @property {string}  [file='index.html'] The name of the file the middleware will serve. It can
 *                                         get overwritten if {@link FastHTML} receives an
 *                                         {@link HTMLGenerator}, in that case, the file will be
 *                                         obtained from that service.
 * @property {Array}   [ignore]            A list of regular expressions to match requests paths
 *                                         that should be ignored.
 * @property {boolean} [useAppRoutes=true] If `true`, {@link FastHTML} will get the list of all
 *                                         routes controlled by {@link Jimpex} and will use them
 *                                         to validate the incoming requests (in addition to
 *                                         `ignore`): If a request URL doesn't match with any of
 *                                         the controlled routes, it will show the HTML file.
 */

/**
 * @typedef {Object} FastHTMLMiddlewareOptions
 * @extends {FastHTMLOptions}
 * @description The only difference with {@link FastHTMLOptions} is that in this options, you can
 *              specify an {@link HTMLGenerator} service name.
 * @property {string} htmlGenerator The name of a {@link HTMLGenerator} service for the middleware
 *                                  to use.
 */

/**
 * It's common for an app to show an HTML view when no route was able to handle a request, so the
 * idea behind this middleware is to avoid going to every middleware and controller and just
 * specify that if the request is not for a route handled by a controller, just serve the HTML
 * and avoid processing unnecessary data.
 *
 * A simple example: The app has a route `/backend` that a frontend uses to get information.
 * This middleware can be used to only allow the execution of middlewares and controllers when
 * the request route is for `/backend`.
 *
 * **Disclaimer**: Managing statics files with Express is not a best practice, but there are
 * scenarios where there is not other choice.
 */
class FastHTML {
  /**
   * @param {EventsHub}       events               To listen for the {@link Jimpex} event
   *                                               triggered after the app starts. The event is
   *                                               used to get all the controlled routes, in case
   *                                               the `useAppRoutes` option is set to true.
   * @param {SendFile}        sendFile             To send the HTML file response.
   * @param {FastHTMLOptions} [options={}]         To customize the middleware behavior.
   * @param {?HTMLGenerator}  [htmlGenerator=null] If used, the file to serve will be the one
   *                                               generated by that service.
   */
  constructor(events, sendFile, options = {}, htmlGenerator = null) {
    /**
     * A local reference for the `events` service.
     * @type {EventsHub}
     * @access protected
     * @ignore
     */
    this._events = events;
    /**
     * A local reference for the `sendFile` service.
     * @type {SendFile}
     * @access protected
     * @ignore
     */
    this._sendFile = sendFile;
    /**
     * If specified, a reference for a service that generates HTML files.
     * @type {?HTMLGenerator}
     * @access protected
     * @ignore
     */
    this._htmlGenerator = htmlGenerator;
    /**
     * The options that tell the middleware which routes should be ignored and which is the file
     * to serve.
     * @type {FastHTMLOptions}
     */
    this._options = this._normalizeOptions(ObjectUtils.merge(
      {
        file: 'index.html',
        ignore: options.ignore || [/\.ico$/i],
        useAppRoutes: true,
      },
      options
    ));
    /**
     * Whether or not the file is ready to be served, in case there's an
     * {@link HTMLGenerator}. If the service is used, the HTML is generated after the app starts,
     * so the middleware will have to wait for it to be ready before being able to serve it.
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._ready = !this._htmlGenerator;
    /**
     * A list of regular expression that match the routes controlled by the app. This is in case
     * the `useAppRoutes` option is set to `true`; when the app gets started, an event listener
     * will obtain all the top controlled routes, create regular expressions and save them on
     * this property.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._routeExpressions = [];
    /**
     * If the option to use the controlled routes is set to `true`, setup the event listener that
     * gets all the routes when the app is started.
     */
    if (this._options.useAppRoutes) {
      this._setupEvents();
    }
  }
  /**
   * Returns the Express middleware that validates the routes and serves the HTML file if necessary.
   * @return {ExpressMiddleware}
   */
  middleware() {
    return (req, res, next) => {
      if (this._shouldIgnore(req.originalUrl)) {
        // If the route should be ignored, move to the next middleware.
        next();
      } else if (!this._ready) {
        // If there's an HTMLGenerator and is not ready, wait for it...
        this._htmlGenerator.whenReady()
        .then(() => {
          // Change the flag to prevent the next execution to enter here.
          this._ready = true;
          // Serve the file.
          this._sendHTML(res, next);
        })
        .catch((error) => {
          // Something went wrong while generating the file, send the error to the error handler.
          next(error);
        });
      } else {
        // The route is not ignored and the file is ready to be served, so do it.
        this._sendHTML(res, next);
      }
    };
  }
  /**
   * The options that tell the middleware which routes should be ignored and which is the file
   * to serve.
   * @type {FastHTMLOptions}
   */
  get options() {
    return Object.freeze(this._options);
  }
  /**
   * Normalizes and validates the options recevied on the constructor.
   * If the class is using a {@link HTMLGenerator} service, the method will overwrite the `file`
   * option with the result of the service's `getFile()` method.
   * @param {FastHTMLOptions} options The received options.
   * @return {FastHTMLOptions}
   * @throws {Error} If no file and no {@link HTMLGenerator} service are specified.
   * @throws {Error} If no routes to ignore are specified and `useAppRoutes` is set to `false`.
   * @access protected
   * @ignore
   */
  _normalizeOptions(options) {
    if (!options.file && !this._htmlGenerator) {
      throw new Error('You need to either define an HTMLGenerator service or a file');
    } else if (!options.ignore.length && !options.useAppRoutes) {
      throw new Error(
        'You need to either define a list of routes to ignore or use `useAppRoutes`'
      );
    }

    return this._htmlGenerator ?
      Object.assign({}, options, { file: this._htmlGenerator.getFile() }) :
      options;
  }
  /**
   * Adds the event listener that obtains the controlled routes when `useAppRoutes` is set to
   * `true`.
   * @access protected
   * @ignore
   */
  _setupEvents() {
    this._events.once(eventNames.afterStart, ({ routes }) => {
      // Re generate the list of expressions...
      this._routeExpressions = routes
      // Remove leading and trailing slashes.
      .map((route) => route.replace(/^\/+/, '').replace(/\/+$/, '').trim())
      // Filter empty routes (in case they were for `/`).
      .filter((route) => route !== '')
      // Remove repeated routes.
      .reduce((unique, route) => (unique.includes(route) ? unique : [...unique, route]), [])
      // Generate regular expressions for each route.
      .map((route) => this._getRouteExpression(route));
    });
  }
  /**
   * Generates a regular expression for a given route.
   * @param {string} route The route from where the expression will be created.
   * @return {RegExp}
   * @access protected
   * @ignore
   */
  _getRouteExpression(route) {
    const expression = route
    // Separate each component of the route.
    .split('/')
    /**
     * If the component is for a paramter, replace it with a expression to match anything; if not,
     * escape it so it can be used on the final expression.
     */
    .map((part) => (
      part.startsWith(':') ?
        '(?:([^\\/]+?))' :
        part.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    ))
    // Put everything back together.
    .join('\\/');
    // Before returning it, add a leading slash, as `req.originalUrl` always have one.
    return new RegExp(`\\/${expression}`);
  }
  /**
   * Checks whether a route should be ignored or not. The method checks first against the `ignore`
   * option, and then against the controlled routes (if `useAppRoutes` is `false`, the list
   * will be empty).
   * @param {string} route The route to validate.
   * @return {boolean}
   * @access protected
   * @ignore
   */
  _shouldIgnore(route) {
    return this._options.ignore.some((expression) => expression.test(route)) ||
      this._routeExpressions.some((expression) => expression.test(route));
  }
  /**
   * Serves the file on the response.
   * @param {ExpressResponse} res  The server response.
   * @param {ExpressNext}     next The function to call the next middleware.
   * @access protected
   * @ignore
   */
  _sendHTML(res, next) {
    res.setHeader('Content-Type', mime.getType('html'));
    this._sendFile(res, this._options.file, next);
  }
}
/**
 * A middleware for filtering routes so you can serve an HTML before the app gets to evaluate
 * whether there's a controller for the requested route or not. For more information about the
 * reason of this middleware, please read the description of {@link FastHTML}.
 * @type {MiddlewareCreator}
 * @param {FastHTMLOptions|FastHTMLMiddlewareOptions} [options={}] The options to customize the
 *                                                                 middleware behavior.
 */
const fastHTML = middlewareCreator((options = {}) => (app) => {
  const htmlGeneratorServiceName = typeof options.htmlGenerator === 'undefined' ?
    'htmlGenerator' :
    options.htmlGenerator;
  return (
    new FastHTML(
      app.get('events'),
      app.get('sendFile'),
      options,
      htmlGeneratorServiceName ? app.try(htmlGeneratorServiceName) : null
    )
  ).middleware();
});

module.exports = {
  FastHTML,
  fastHTML,
};
