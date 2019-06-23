/**
 * @typedef {Object} Provider
 * @description An object that when registered on Jimpex will take care of setting up services
 *              and/or configuring the app. The method Jimpex uses to register a provider is
 *              {@link Jimpex#register} and is inherit from {@link Jimple}.
 * @property {ProviderRegistrationCallback} register The function Jimpex calls when registering
 *                                                   the provider.
 * @property {Boolean}                      provider A flag set to `true` to identify the resource
 *                                                   as a service provider.
 */

/**
 * @typedef {function} ProviderCreator
 * @description A special kind of {@link Provider} because it can be used with
 *              {@link Jimpex#register} as a regular provider, or it can be called as a function
 *              with custom paramters in order to obtain a "configured {@link Provider}"
 * @return {Provider}
 */

/**
 * @typedef {function} ProviderRegistrationCallback
 * @description The function called by the app container in order to register a service provider.
 * @param {Jimpex} app The instance of the app container.
 */

/**
 * @typedef {function} ProviderCreatorCallback
 * @description A function called in order to generate a {@link Provider}. They usually have
 *              different options that will be sent to the service registration.
 * @return {ProviderRegistrationCallback}
 */

/**
 * @typedef {Object} Controller
 * @description An object that when mounted on Jimpex will take care of handling a list of specific
 *              routes. The method Jimpex uses to mount a controller is {@link Jimpex#mount}.
 * @property {ControllerMountCallback} connect    The function Jimpex calls when mounting the
 *                                                controller.
 * @property {Boolean}                 controller A flag set to `true` to identify the resource
 *                                                as a routes controller.
 */

/**
 * @typedef {function} ControllerCreator
 * @description A special kind of {@link Controller} because it can be used with
 *              {@link Jimpex#mount} as a regular controller, or it can be called as a function
 *              with custom paramters in order to obtain a "configured {@link Controller}"
 * @return {Controller}
 */

/**
 * @typedef {function} ControllerMountCallback
 * @description The function called by the app container in order to mount a routes controller.
 * @param {Jimpex} app   The instance of the app container.
 * @param {string} route The route where the controller will be mounted.
 * @return {Array|ExpressRouter} The list of routes the controller will manage, or a router
 *                               instance.
 */

/**
 * @typedef {function} ControllerCreatorCallback
 * @description A function called in order to generate a {@link Controller}. They usually have
 *              different options that will be sent to the controller creation.
 * @return {ControllerMountCallback}
 */

/**
 * @typedef {Object} Middleware
 * @description An object that when mounted on Jimpex add an {@link ExpressMiddleware} to the app.
 *              The method Jimpex uses to mount a middleware is {@link Jimpex#use}.
 * @property {MiddlewareUseCallback} connect    The function Jimpex calls when mounting the
 *                                              middleware.
 * @property {Boolean}               middleware A flag set to `true` to identify the resource
 *                                              as a middleware.
 */

/**
 * @typedef {function} MiddlewareCreator
 * @description A special kind of {@link Middleware} because it can be used with
 *              {@link Jimpex#use} as a regular middleware, or it can be called as a function
 *              with custom paramters in order to obtain a "configured {@link Middleware}"
 * @return {Middleware}
 */

/**
 * @typedef {function} MiddlewareUseCallback
 * @description The function called by the app container in order to use a middleware.
 * @param {Jimpex} app The instance of the app container.
 * @return {?ExpressMiddleware} A middleware for Express to use. It can also return `null` in case
 *                              there's a reason for the middleware not to be active.
 */

/**
 * @typedef {function} MiddlewareCreatorCallback
 * @description A function called in order to generate a {@link Middleware}. They usually have
 *              different options that will be sent to the middleware creation.
 * @return {MiddlewareUseCallback}
 */

/**
 * This is a helper the wrappers use in order to create an object by placing a given function
 * on an specific key.
 * @param {string}   name The name of the resource. It will also be added to the object as a
 *                        property with the value of `true`.
 * @param {string}   key  The key in which the function will be placed.
 * @param {function} fn   The function to insert in the object.
 * @return {Object}
 * @ignore
 */
const resource = (name, key, fn) => ({
  [key]: fn,
  [name]: true,
});
/**
 * Similar to `resource`, this helper creates an "object" and places a given function on an
 * specify key. The difference is that instead of being an actual object what gets created, it's
 * another function, then a proxy is added to that function in order to intercept the `key`
 * property and return the result of the function.
 *
 * This is kind of hard to explain, so let's compare it with `resource` and use a proper example:
 * - `resource`: (name, key, fn) => ({ [key]: fn, [name]: true })
 * - `resourceCreator`: ((name, key, creatorFn) => creatorFn(...) => fn)[key]: creatorFn()
 *
 * While `resource` is meant to create objects with a resource function, this is meant to create
 * those resource functions by sending them "optional paramters", and they are optionals because
 * if you access the `key` property, it would be the same as calling the `creatorFn` without
 * paramters.
 * @param {string}   name      The name of the resource, to be added as a property of both the
 *                             generated resource and the one with the proxy. The value of the
 *                             property will be `true`.
 * @param {string}   key       The key in which the creator function will be placed in case it's
 *                             used without parameters; and also the key in which the result
 *                             function from the creator will be placed if called with parameters.
 * @param {function} creatorFn The function that generates the "resource function".
 * @return {function}
 * @ignore
 */
const resourceCreator = (name, key, creatorFn) => new Proxy(
  (...args) => resource(name, key, creatorFn(...args)),
  {
    name,
    resource: null,
    get(target, property) {
      let result;
      if (property === this.name) {
        result = true;
      } else if (property === key) {
        if (this.resource === null) {
          this.resource = creatorFn();
        }
        result = this.resource;
      } else {
        result = target[property];
      }

      return result;
    },
  }
);
/**
 * Generates a service provider for the app container.
 * @param {ProviderRegistrationCallback} registerFn A function that will be called the moment the
 *                                                  app registers the provider.
 * @return {Provider}
 */
const provider = (registerFn) => resource('provider', 'register', registerFn);
/**
 * Generates a collection of service providers that can be registered all at once or one by one.
 * You can send the collection directly to the `.register()` and it will register all its
 * "children"; and if you want to register one provider at a time, you can access them by name,
 * as the collection is a regular object.
 * @example
 * const collection = providers({ one: providerOne, two: providerTwo });
 * // Register all at once
 * app.register(collection);
 * // Register one by one
 * app.register(collection.one);
 * app.register(collection.two);
 * @param {Object} items A dictionary of service providers; the keys will be for the collection
 *                       object, and the values the one that will get send to `.register()`.
 * @return {Provider}
 */
const providers = (items) => {
  const invalidNames = Object.keys(items).some((name) => (
    ['register', 'providers'].includes(name)
  ));
  if (invalidNames) {
    throw new Error(
      'You can\'t create a collection with a providers called `register` or `providers`'
    );
  }

  return Object.assign(
    resource(
      'providers',
      'register',
      (app) => Object.keys(items).forEach((item) => {
        app.register(items[item]);
      })
    ),
    items
  );
};
/**
 * Generates a configurable service provider for the app container. It's configurable because
 * the creator, instead of just being sent to the container to register, it can also be called
 * as a function with custom parameters the service can receive.
 * @example
 * const myService = providerCreator((options) => (app) => {
 *   app.set('myService', () => new MyService(options));
 * });
 * @param {ProviderCreatorCallback} creatorFn The function that generates the provider.
 * @return {ProviderCreator}
 */
const providerCreator = (creatorFn) => resourceCreator('provider', 'register', creatorFn);
/**
 * Generates a routes controller for the app container to mount.
 * @param {ControllerMountCallback} connectFn A function that will be called the moment the app
 *                                            mounts the controller. It should return a list of
 *                                            routes.
 * @return {Controller}
 */
const controller = (connectFn) => resource('controller', 'connect', connectFn);
/**
 * Generates a configurable routes controller for the app to mount. It's configurable because
 * the creator, instead of just being sent to the container to mount, it can also be called
 * as a function with custom parameters the controller can receive.
 * @example
 * const myController = controllerCreator((options) => (app) => {
 *   const router = app.get('router');
 *   const ctrl = new MyController(options);
 *   return [router.get('...', ctrl.doSomething())];
 * });
 * @param {ProviderCreatorCallback} creatorFn The function that generates the controller.
 * @return {ProviderCreator}
 */
const controllerCreator = (creatorFn) => resourceCreator('controller', 'connect', creatorFn);
/**
 * Generates a middleware for the app to use.
 * @param {MiddlewareUseCallback} connectFn A function that will be called the moment the app
 *                                          mounts the middleware.
 * @return {Middleware}
 */
const middleware = (connectFn) => resource('middleware', 'connect', connectFn);
/**
 * Generates a configurable middleware for the app to use. It's configurable because the creator,
 * instead of just being sent to the container to use, it can also be called as a function with
 * custom parameters the middleware can receive.
 * @example
 * const myMiddleware = middlewareCreator((options) => (app) => (
 *   options.enabled ?
 *     (req, res, next) => {} :
 *     null
 * ));
 * @param {ProviderCreatorCallback} creatorFn The function that generates the middleware.
 * @return {ProviderCreator}
 */
const middlewareCreator = (creatorFn) => resourceCreator('middleware', 'connect', creatorFn);

module.exports = {
  provider,
  providerCreator,
  providers,
  controller,
  controllerCreator,
  middleware,
  middlewareCreator,
};
