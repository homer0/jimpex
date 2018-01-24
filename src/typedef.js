/**
 * @external {AppConfiguration}
 * https://homer0.github.io/wootils/class/wootils/node/appConfiguration.js~AppConfiguration.html
 */

/**
 * @external {APIClientBase}
 * https://homer0.github.io/wootils/class/wootils/shared/apiClient.js~APIClient.html
 */

/**
 * @external {APIClientEndpoints}
 * https://homer0.github.io/wootils/typedef/index.html#static-typedef-APIClientEndpoints
 */

/**
 * @external {PathUtils}
 * https://homer0.github.io/wootils/class/wootils/node/pathUtils.js~PathUtils.html
 */

/**
 * @external {Logger}
 * https://homer0.github.io/wootils/class/wootils/node/logger.js~Logger.html
 */

/**
 * @external {EnvironmentUtils}
 * https://homer0.github.io/wootils/class/wootils/node/environmentUtils.js~EnvironmentUtils.html
 */

/**
 * @external {ErrorHandler}
 * https://homer0.github.io/wootils/class/wootils/node/errorHandler.js~ErrorHandler.html
 */

/**
 * @external {RootRequire}
 * https://homer0.github.io/wootils/function/index.html#static-function-rootRequire
 */

/**
 * @external {Express} https://expressjs.com/en/4x/api.html
 */

/**
 * @external {ExpressMiddleware} http://expressjs.com/en/guide/using-middleware.html
 */

/**
 * @external {ExpressRequest} https://expressjs.com/en/4x/api.html#req
 */

/**
 * @external {ExpressResponse} https://expressjs.com/en/4x/api.html#res
 */

/**
 * @external {ExpressResponse} https://expressjs.com/en/4x/api.html#res
 */

/**
 * @typedef {function(err:?Error)} ExpressNext A function to call the next middleware. If an
 *                                            argument is specified, it will be handled as an error
 *                                            and sent to the `errorHandler` service.
 */

/**
 * @typedef {Object} Provider An object that when registered on Jimpex will take care of setting up
 *                            services and/or configuring the app.
 *                            The method Jimpex uses to register a provider is `register(provider)`
 *                            and is inherit from Jimple.
 * @property {function(app:Jimpex)} register The method that gets called by Jimpex when registering
 *                                           the provider.
 */

/**
 * @typedef {Object} Controller An object that when mounted on Jimpex will return a list of routes
 *                              to handle an specific point.
 *                              The method Jimpex uses to mount a controller is
 *                              `mount(point, controller)`.
 * @property {function(app:Jimpex,point:String):Array} connect The method that gets called by
 *                                                             Jimpex when the controller is
 *                                                             mounted. It should return a list
 *                                                             of routes.
 */

/**
 * @typedef {Object} Middleware An object that when mounted on Jimpex will return an Express
 *                              middleware for the app to use.
 *                              The method Jimpex uses to mount a controller is `use(middleware)`.
 * @property {function(app:Jimpex):?ExpressMiddleware} connect The method that gets called by Jimpex
 *                                                             when the middleware is mounted. It
 *                                                             should return an Express middleware.
 */
