/**
 * @typedef {Object} JimpexEvents
 * @description The name of all the events {@link Jimpex} can trigger.
 * @property {string} beforeStart              Called before `listen` is executed on the Express
 *                                             app.
 * @property {string} start                    Called from the `listen` callback, when the app is
 *                                             ready to be used.
 * @property {string} afterStart               Called from the `listen` callback, when all
 *                                             controllers and middlewares have been mounted.
 * @property {string} afterStartCallback       Called right after the callback sent to `start`
 *                                             gets executed.
 * @property {string} beforeStop               Called before closing the instance of the app.
 * @property {string} afterStop                called after the app instance has been closed and
 *                                             deleted.
 * @property {string} routeAdded               Called every time a new route is added to the app.
 * @property {string} controllerWillBeMounted  This is for a reducer event. It gets called before
 *                                             mounting a router or a set of routes to the app in
 *                                             order to "reduce it".
 * @property {string} middlewareWillBeUsed     This is for a reducer event. it gets called before
 *                                             using a middleware in order to "reduce it".
 */

/**
 * The name of all the events {@link Jimpex} can trigger.
 * @type {JimpexEvents}
 */
module.exports = {
  beforeStart: 'before-start',
  start: 'start',
  afterStart: 'after-start',
  afterStartCallback: 'after-start-callback',
  beforeStop: 'before-stop',
  afterStop: 'after-stop',
  controllerWillBeMounted: 'controller-will-be-mounted',
  routeAdded: 'route-added',
  middlewareWillBeUsed: 'middleware-will-be-used',
};
