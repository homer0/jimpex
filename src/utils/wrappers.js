const { provider } = require('jimple');
/**
 * Generates a controller for the app container to mount.
 * @param {function(app:Jimpex):Array} connect A function that will be called the moment the app
 *                                             mounts the controller. It should return a list
 *                                             of routes.
 * @return {Controller}
 */
const controller = (connect) => ({ connect });
/**
 * Generates a middleware for the app container to use.
 * @param {function(app:Jimpex):?ExpressMiddleware} connect A function that will be called the
 *                                                          moment the app mounts the middleware.
 *                                                          It should return an Express middleware.
 * @return {Middleware}
 */
const middleware = (connect) => ({ connect });

module.exports = {
  provider,
  controller,
  middleware,
};
