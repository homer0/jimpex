const {
  provider,
  providerCreator,
  providers,
  resource,
  resourceCreator,
} = require('wootils/shared/jimpleFns');

/**
 * @typedef {import('../types').ControllerConnectFn} ControllerConnectFn
 * @typedef {import('../types').ControllerCreatorFn} ControllerCreatorFn
 * @typedef {import('../types').MiddlewareConnectFn} MiddlewareConnectFn
 * @typedef {import('../types').MiddlewareCreatorFn} MiddlewareCreatorFn
 */

/**
 * @module wrappers
 */

/**
 * Generates a routes controller for the application container to mount.
 *
 * @example
 *
 *   const myController = controller((app) => {
 *     const router = app.get('router');
 *     const ctrl = new MyController();
 *     return router.get('...', ctrl.doSomething()).post('...', ctrl.doSomethingElse());
 *   });
 *
 * @param {ControllerConnectFn} connectFn  A function that will be called the moment the
 *                                         app mounts the controller.
 * @returns {Controller}
 * @parent module:wrappers
 */
const controller = (connectFn) => resource('controller', 'connect', connectFn);
/**
 * Generates a configurable routes controller for the application to mount. It's
 * configurable because the creator, instead of just being sent to the container to mount,
 * it can also be called as a function with custom parameters the controller can receive.
 *
 * @example
 *
 *   const myController = controllerCreator((options = {}) => (app) => {
 *     const router = app.get('router');
 *     const ctrl = new MyController(options);
 *     return router.get('...', ctrl.doSomething()).post('...', ctrl.doSomethingElse());
 *   });
 *
 * @param {ControllerCreatorFn} creatorFn  The function that generates the controller.
 * @returns {ControllerCreator<any>}
 * @parent module:wrappers
 */
const controllerCreator = (creatorFn) =>
  resourceCreator('controller', 'connect', creatorFn);
/**
 * Generates a middleware for the app to use.
 *
 * @example
 *
 *   const myMiddleware = middleware((app) => (req, res, next) => {
 *     if (req.query.greet !== 'true') {
 *       return next();
 *     }
 *
 *     app.get('responsesBuilder').json(res, {
 *       hello: 'world',
 *     });
 *   });
 *
 * @example
 *
 * <caption>Disable the middleware base on a configuration option</caption>
 *
 *   const myMiddleware = middleware((app) => {
 *     if (app.get('appConfiguration').get('someOption') !== true) {
 *       return null;
 *     }
 *
 *     return (req, res, next) => {
 *       if (req.query.hello !== 'world') return next();
 *       app.get('responsesBuilder').json(res, {
 *         hello: 'world',
 *       });
 *     };
 *   });
 *
 * @param {MiddlewareConnectFn} connectFn  A function that will be called the moment the
 *                                         app mounts the middleware.
 * @returns {Middleware}
 * @parent module:wrappers
 */
const middleware = (connectFn) => resource('middleware', 'connect', connectFn);
/**
 * Generates a configurable middleware for the app to use. It's configurable because the
 * creator,
 * instead of just being sent to the container to use, it can also be called as a function
 * with custom parameters the middleware can receive.
 *
 * @example
 *
 *   const myMiddleware = middlewareCreator((options = {}) => (app) =>
 *     options.enabled ? (req, res, next) => {} : null,
 *   );
 *
 * @param {MiddlewareCreatorFn} creatorFn  The function that generates the middleware.
 * @returns {MiddlewareCreator<any>}
 * @parent module:wrappers
 */
const middlewareCreator = (creatorFn) =>
  resourceCreator('middleware', 'connect', creatorFn);

module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
module.exports.controller = controller;
module.exports.controllerCreator = controllerCreator;
module.exports.middleware = middleware;
module.exports.middlewareCreator = middlewareCreator;
