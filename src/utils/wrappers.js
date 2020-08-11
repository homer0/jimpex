const {
  provider,
  providerCreator,
  providers,
  resource,
  resourceCreator,
} = require('wootils/shared/jimpleFns');

/**
 * @typedef {import('../app')} Jimpex
 */

/**
 * @typedef {import('express').Router} Router
 * @typedef {import('express').RequestHandler} RequestHandler
 * @typedef {import('express').ErrorRequestHandler} ErrorRequestHandler
 * @typedef {RequestHandler|ErrorRequestHandler} ExpressMiddleware
 * @typedef {import('wootils/esm/shared/jimpleFns').Provider} Provider
 * @typedef {import('wootils/esm/shared/jimpleFns').Providers} Providers
 */

/**
 * @template O
 * @typedef {import('wootils/esm/shared/jimpleFns').ProviderCreator<O>} ProviderCreator<O>
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
 * @returns {Controller}
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
 * Generates a routes controller for the application container to mount.
 *
 * @example
 * const myController = controller((app) => {
 *   const router = app.get('router');
 *   const ctrl = new MyController();
 *   return router
 *   .get('...', ctrl.doSomething())
 *   .post('...', ctrl.doSomethingElse());
 * });
 *
 * @param {ControllerConnectFn} connectFn A function that will be called the moment the app mounts
 *                                        the controller.
 * @returns {Controller}
 */
const controller = (connectFn) => resource('controller', 'connect', connectFn);
/**
 * Generates a configurable routes controller for the application to mount. It's configurable
 * because the creator, instead of just being sent to the container to mount, it can also be called
 * as a function with custom parameters the controller can receive.
 *
 * @example
 * const myController = controllerCreator((options = {}) => (app) => {
 *   const router = app.get('router');
 *   const ctrl = new MyController(options);
 *   return router
 *   .get('...', ctrl.doSomething())
 *   .post('...', ctrl.doSomethingElse());
 * });
 *
 * @param {ControllerCreatorFn} creatorFn The function that generates the controller.
 * @returns {ControllerCreator<*>}
 */
const controllerCreator = (creatorFn) => resourceCreator('controller', 'connect', creatorFn);
/**
 * Generates a middleware for the app to use.
 *
 * @example
 * const myMiddleware = middleware((app) => (req, res, next) => {
 *   if (req.query.greet !== 'true') {
 *     return next();
 *   }
 *
 *   app.get('responsesBuilder').json(res, {
 *     hello: 'world',
 *   });
 * });
 *
 * @example
 * <caption>Disable the middleware base on a configuration option</caption>
 * const myMiddleware = middleware((app) => {
 *   if (app.get('appConfiguration').get('someOption') !== true) {
 *     return null;
 *   }
 *
 *   return (req, res, next) => {
 *     if (req.query.hello !== 'world') return next();
 *     app.get('responsesBuilder').json(res, {
 *       hello: 'world',
 *     });
 *   };
 * });
 *
 * @param {MiddlewareConnectFn} connectFn A function that will be called the moment the app
 *                                        mounts the middleware.
 * @returns {Middleware}
 */
const middleware = (connectFn) => resource('middleware', 'connect', connectFn);
/**
 * Generates a configurable middleware for the app to use. It's configurable because the creator,
 * instead of just being sent to the container to use, it can also be called as a function with
 * custom parameters the middleware can receive.
 *
 * @example
 * const myMiddleware = middlewareCreator((options = {}) => (app) => (
 *   options.enabled ?
 *     (req, res, next) => {} :
 *     null
 * ));
 *
 * @param {MiddlewareCreatorFn} creatorFn The function that generates the middleware.
 * @returns {MiddlewareCreator<*>}
 */
const middlewareCreator = (creatorFn) => resourceCreator('middleware', 'connect', creatorFn);

module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
module.exports.controller = controller;
module.exports.controllerCreator = controllerCreator;
module.exports.middleware = middleware;
module.exports.middlewareCreator = middlewareCreator;
