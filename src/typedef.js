/**
 * @external Jimple
 * @see https://yarnpkg.com/en/package/jimple
 */

/**
 * @typedef {import('wootils/esm/node/appConfiguration').AppConfiguration} AppConfiguration
 * @external AppConfiguration
 * @see https://homer0.github.io/wootils/module-node_appConfiguration.AppConfiguration.html
 */

/**
 * @typedef {import('wootils/esm/shared/apiClient').default} APIClientBase
 * @external APIClientBase
 * @see https://homer0.github.io/wootils/module-shared_apiClient.APIClient.html
 */

/**
 * @typedef {import('wootils/esm/shared/apiClient').APIClientEndpoints} APIClientEndpoints
 * @external APIClientEndpoints
 * @see https://homer0.github.io/wootils/module-shared_apiClient.html#.APIClientEndpoints
 */

/**
 * @typedef {import('wootils/esm/node/pathUtils').PathUtils} PathUtils
 * @external PathUtils
 * @see https://homer0.github.io/wootils/module-node_pathUtils.PathUtils.html
 */

/**
 * @typedef {import('wootils/esm/node/logger').Logger} Logger
 * @external Logger
 * @see https://homer0.github.io/wootils/module-node_logger.Logger.html
 */

/**
 * @typedef {import('wootils/esm/node/environmentUtils').EnvironmentUtils} EnvironmentUtils
 * @external EnvironmentUtils
 * @see https://homer0.github.io/wootils/module-node_environmentUtils.EnvironmentUtils.html
 */

/**
 * @typedef {import('wootils/esm/node/errorHandler').ErrorHandler} ErrorHandler
 * @external ErrorHandler
 * @see https://homer0.github.io/wootils/module-node_errorHandler.html
 */

/**
 * @typedef {import('wootils/esm/shared/eventsHub').default} EventsHub
 * @external EventsHub
 * @see https://homer0.github.io/wootils/module-shared_eventsHub.html
 */

/**
 * @typedef {import('wootils/esm/node/rootRequire').RootRequireFn} RootRequire
 * @external RootRequire
 * @see https://homer0.github.io/wootils/module-node_rootRequire.html#.RootRequireFn
 */

/**
 * @typedef {import('express').Express} Express
 * @external Express
 * @see https://expressjs.com/en/4x/api.html
 */

/**
 * @typedef {import('http').Server} HTTPServer
 * @external HTTPServer
 * @see https://nodejs.org/docs/latest-v10.x/api/http.html#http_class_http_server
 */

/**
 * @typedef {import('spdy').ServerOptions} SpdyOptions
 * @external SpdyOptions
 * @see https://github.com/spdy-http2/node-spdy#options
 */

/**
 * @typedef {import('spdy').Server} SpdyServer
 * @external SpdyServer
 * @see https://github.com/spdy-http2/node-spdy
 */

/**
 * @typedef {HTTPServer|SpdyServer} Server
 */

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 * @typedef {import('express').ErrorRequestHandler} ErrorRequestHandler
 */

/**
 * @typedef {RequestHandler|ErrorRequestHandler} ExpressMiddleware
 * @external ExpressMiddleware
 * @see http://expressjs.com/en/guide/using-middleware.html
 */

/**
 * @typedef {import('express').Request} ExpressRequest
 * @external ExpressRequest
 * @see https://expressjs.com/en/4x/api.html#req
 */

/**
 * @typedef {import('express').Response} ExpressResponse
 * @external ExpressResponse
 * @see https://expressjs.com/en/4x/api.html#res
 */

/**
 * @typedef {import('express').Router} Router
 * @external Router
 * @see https://expressjs.com/en/4x/api.html#router
 */

/**
 * @typedef {import('express').NextFunction} ExpressNext
 * @external ExpressNext
 * @see https://expressjs.com/en/guide/writing-middleware.html
 */

/**
 * @typedef {import('wootils/esm/shared/jimpleFns').Provider} Provider
 * @external Provider
 * @see https://homer0.github.io/wootils/module-shared_jimpleFns.html#.Provider
 */

/**
 * @typedef {import('wootils/esm/shared/jimpleFns').Providers} Providers
 * @external Providers
 * @see https://homer0.github.io/wootils/module-shared_jimpleFns.html#.Providers
 */

/**
 * @template O
 * @typedef {import('wootils/esm/shared/jimpleFns').ProviderCreator<O>} ProviderCreator<O>
 * @external ProviderCreator
 * @see https://homer0.github.io/wootils/module-shared_jimpleFns.html#~providerCreator
 */

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {import('./services/common/httpError')['HTTPError']} ClassHTTPError
 * @typedef {import('./services/common/appError')['AppError']} ClassAppError
 */
/* eslint-enable jsdoc/valid-types */

/**
 * @callback JimpexStartCallback
 * @param {AppConfiguration} appConfiguration The service that handles the application
 *                                            configuration.
 */

/**
 * @typedef {Object} JimpexConfigurationOptions
 * @property {?Object} default                      The app default configuration. Default `null`.
 * @property {string}  name                         The name of the app, used for the configuration
 *                                                  files. Default `'app'`.
 * @property {string}  path                         The path to the configuration files directory,
 *                                                  relative to the project root directory. Default
 *                                                  `'config/'`.
 * @property {boolean} hasFolder                    Whether the configurations are inside a sub
 *                                                  directory or not. If `true`, a configuration
 *                                                  path would be `config/[app-name]/[file]`.
 *                                                  Default `true`.
 * @property {string}  environmentVariable          The name of the environment variable that will
 *                                                  be used to set the active configuration.
 *                                                  Default `'CONFIG'`.
 * @property {boolean} loadFromEnvironment          Whether or not to check for the environment
 *                                                  variable and load a configuration based on its
 *                                                  value. Default `true`.
 * @property {boolean} loadVersionFromConfiguration If `true`, the app `version` will be taken
 *                                                  from the loaded configuration, otherwise, when
 *                                                  a configuration is loaded, the app will copy
 *                                                  the version it has into the configuration.
 *                                                  Default `true`.
 * @property {string}  filenameFormat               The name format the configuration files have.
 *                                                  Default:
 *                                                  `[app-name].[configuration-name].config.js`.
 */

/**
 * @typedef {Object} JimpexStaticsOptions
 * @property {boolean} enabled Whether or not to include the middleware for static files. Default
 *                             `true`.
 * @property {boolean} onHome  If `true`, the path to the statics folder will be relative to the
 *                             project root directory, otherwise, it will be relative to the
 *                             directory where the app executable file is located. Default `false`.
 * @property {string}  route   The name of both the route and the folder, relative to whatever you
 *                             defined with the `onHome` option. Default `'static'`.
 * @property {string}  folder  By default, the folder will be the same as the `route`, but you can
 *                             use this option to define a relative path that won't affect the
 *                             route. Default `''`.
 */

/**
 * @typedef {Object} JimpexExpressOptions
 * @property {boolean} trustProxy        Whether or not to enable the `trust proxy` option.
 *                                       Default `true`.
 * @property {boolean} disableXPoweredBy Whether or not to remove the `x-powered-by` header.
 *                                       Default `true`.
 * @property {boolean} compression       Whether or not to add the `compression` middleware.
 *                                       Default `true`.
 * @property {boolean} bodyParser        Whether or not to add the `body-parser` middleware.
 *                                       Default `true`.
 * @property {boolean} multer            Whether or not to add the `multer` middleware.
 *                                       Default `true`.
 */

/**
 * @typedef {Object} JimpexDefaultServicesOptions
 * @property {boolean} common Whether or not to register all the `common` service providers.
 *                            Default `true`.
 * @property {boolean} http   Whether or not to register all the `http` service providers.
 *                            Default `true`.
 * @property {boolean} utils  Whether or not to register all the `utils` service providers.
 *                            Default `true`.
 */

/**
 * @typedef {Object} JimpexOptions
 * @property {string}                       version         The app version. To be used on the
 *                                                          configuration. Default `'0.0.0'`.
 * @property {string}                       filesizeLimit   The size limit for the requests
 *                                                          payload. Default `'15MB'`.
 * @property {boolean}                      boot            Whether or not to automatically call
 *                                                          the `boot` method after initialization.
 *                                                          Default `true`.
 * @property {JimpexConfigurationOptions}   configuration   The options for the app configuration
 *                                                          service.
 * @property {JimpexStaticsOptions}         statics         The options for the app static
 *                                                          `middleware`.
 * @property {JimpexExpressOptions}         express         The options for the Express app.
 * @property {JimpexDefaultServicesOptions} defaultServices To tell the app which services should
 *                                                          be registered when instantiated.
 */

/**
 * @typedef {import('./app').Jimpex} Jimpex
 */

/**
 * An object that when mounted on Jimpex will take care of handling a list of specific routes. The
 * method Jimpex uses to mount a controller is {@link Jimpex#mount}.
 *
 * @typedef {Object} Controller
 * @property {ControllerConnectFn} connect    The function Jimpex calls when mounting the
 *                                            controller.
 * @property {boolean}             controller A flag set to `true` to identify the resource
 *                                            as a routes controller.
 */

/**
 * @callback ControllerProviderRegisterFn
 * @param {Jimpex} app   The instance of the application container.
 * @param {string} route The route where the controller will be mounted.
 * @returns {Controller}
 */

/**
 * This is a special kind of controller that not only registers routes but also adds resources to
 * the container, and to avoid doing it during the mount process, it registers the resources first
 * and then returns the actuall controller.
 *
 * @typedef {Object} ControllerProvider
 * @property {ControllerProviderRegisterFn} register  The function Jimpex calls when registering
 *                                                    the provider and the one that has to generate
 *                                                    the controller.
 */

/**
 * The function called by the application container in order to mount a routes controller.
 *
 * @callback ControllerConnectFn
 * @param {Jimpex} app   The instance of the application container.
 * @param {string} route The route where the controller will be mounted.
 * @returns {Router} The controller router.
 */

/**
 * A function called in order to generate a {@link Controller}. They usually have different options
 * that will be sent to the controller creation.
 *
 * @callback ControllerCreatorFn
 * @returns {ControllerConnectFn}
 */

/**
 * A special kind of {@link Controller} that can be used with {@link Jimpex#mount} as a regular
 * controller, or it can be called as a function with custom parameters in order to obtain
 * a "configured {@link Controller}".
 *
 * @callback ControllerCreator
 * @param {Partial<O>} [options={}] The options to create the controller.
 * @returns {Controller|ControllerProvider}
 * @template O
 */

/**
 * An object that when mounted on Jimpex add an {@link ExpressMiddleware} to the app. The method
 * Jimpex uses to mount a middleware is {@link Jimpex#use}.
 *
 * @typedef {Object} Middleware
 * @property {MiddlewareConnectFn} connect    The function Jimpex calls when mounting the
 *                                            middleware.
 * @property {boolean}             middleware A flag set to `true` to identify the resource as a
 *                                            middleware.
 */

/**
 * The function called by the application container in order to use a middleware.
 *
 * @callback MiddlewareConnectFn
 * @param {Jimpex} app The instance of the application container.
 * @returns {?ExpressMiddleware} A middleware for Express to use. It can also return `null` in
 *                               case there's a reason for the middleware not to be active.
 */

/**
 * A function called in order to generate a {@link Middleware}. They usually have different options
 * that will be sent to the middleware creation.
 *
 * @callback MiddlewareCreatorFn
 * @returns {MiddlewareConnectFn}
 */

/**
 * A special kind of {@link Middleware} that can be used with {@link Jimpex#use} as a regular
 * middleware, or it can be called as a function with custom parameters in order to obtain
 * a "configured {@link Middleware}".
 *
 * @callback MiddlewareCreator
 * @param {Partial<O>} [options={}] The options to create the controller.
 * @returns {Middleware}
 * @template O
 */

/**
 * @typedef {Middleware|ExpressMiddleware} MiddlewareLike
 */
