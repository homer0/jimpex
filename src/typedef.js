/**
 * @external {AppConfiguration} https://github.com/homer0/wootils
 */

/**
 * @external {APIClientBase} https://github.com/homer0/wootils
 */

/**
 * @external {APIClientEndpoints} https://github.com/homer0/wootils
 */

/**
 * @external {PathUtils} https://github.com/homer0/wootils
 */

/**
 * @external {Logger} https://github.com/homer0/wootils
 */

/**
 * @external {EnvironmentUtils} https://github.com/homer0/wootils
 */

/**
 * @external {ErrorHandler} https://github.com/homer0/wootils
 */

/**
 * @external {RootRequire} https://github.com/homer0/wootils
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
