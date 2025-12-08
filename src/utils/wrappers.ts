import {
  createProvider,
  createProviderCreator,
  createProviders,
  resourceFactory,
  type ProviderRegisterFn as OriginalProviderRegisterFn,
  type GenericCurriedFn,
  resourceCreatorFactory,
} from '@homer0/jimple';
import type { Jimpex } from '../app/index.js';
import type { Router, ExpressMiddlewareLike, NoStringIndex } from '../types/index.js';
/**
 * The function a provider uses to configure a resource in the container.
 *
 * @group Wrappers
 */
export type ProviderRegisterFn = OriginalProviderRegisterFn<Jimpex>;
/**
 * Creates an object that can configure/extend the container by registering services and
 * resources.
 *
 * @example
 *
 *   class APIClient {}
 *   const apiClientProvider = provider((app) => {
 *     app.set('apiClient', () => new APIClient());
 *   });
 *
 * @group Wrappers
 */
export const provider = createProvider<Jimpex>();
/**
 * Creates an object like a provider, but that it can also be used as a function, as it
 * normally expose options for the resources it will configure.
 *
 * @example
 *
 * <caption>Registering as a common provider</caption>
 *
 *   const apiClientProvider = providerCreator(
 *     ({ serviceName = 'apiClient' }) =>
 *       (app) => {
 *         app.set(serviceName, () => new APIClient());
 *       },
 *   );
 *
 *   container.register(apiClientProvider);
 *
 * @example
 *
 * <caption>Registering a created provider</caption>
 *
 *   container.register(
 *     apiClientProvider({
 *       serviceName: 'myApiClient',
 *     }),
 *   );
 *
 * @group Wrappers
 */
export const providerCreator = createProviderCreator<Jimpex>();
/**
 * Creates a collection of providers that can be registered one by one, or all at once.
 *
 * @example
 *
 * <caption>Registering all the providers at once</caption>
 *
 *   const collection = providers({
 *     apiClient: apiClientProvider,
 *     http: httpProvider,
 *   });
 *
 *   container.register(collection);
 *
 * @example
 *
 * <caption>Registering one by one</caption>
 *
 *   container.register(collection.http);
 *
 * @group Wrappers
 */
export const providers = createProviders<Jimpex>();
/**
 * An object that can configure/extend the container by registering services and
 * resources.
 *
 * @group Wrappers
 */
export type Provider = ReturnType<typeof provider>;
/**
 * A provider creator is like a provider, but it can also be used as a function, and it
 * expose options for the resources it will configure.
 *
 * @group Wrappers
 */
export type ProviderCreator = ReturnType<typeof providerCreator>;
/**
 * A collection of providers that can be registered one by one, or all at once.
 *
 * @group Wrappers
 */
export type Providers = ReturnType<typeof providers>;
/**
 * A union of all types that can be registered in the provider with a `register` function.
 *
 * @group Wrappers
 */
export type ProviderLike = Provider | ProviderCreator | Providers;

// --
/**
 * The function a controller uses to mount a controller/middleware in the container.
 *
 * @param container  The reference to the Jimpex container.
 * @param route      The route on which the controller will be mounted on.
 * @group Wrappers
 */
export type ControllerConnectFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route: string,
) => Router | ExpressMiddlewareLike;

const controllerFactory = resourceFactory<ControllerConnectFn>();
/**
 * Generates a routes controller for the application container to mount.
 *
 * @param connect  A function that will be called the moment the application mounts the
 *                 controller, and that is in charge of registering routes and
 *                 middlewares.
 * @example
 *
 *   const myController = controller((app) => {
 *     const router = app.getRouter();
 *     const ctrl = new MyController();
 *     return router.get('...', ctrl.doSomething()).post('...', ctrl.doSomethingElse());
 *   });
 *
 *   // ...
 *   container.mount('/charo', myController);
 *
 * @group Wrappers
 */
export const controller = (connect: ControllerConnectFn) =>
  controllerFactory('controller', 'connect', connect);
/**
 * A high order function that generates a controller. It's used on the definitions of a
 * controller creator.
 *
 * @group Wrappers
 */
export type ControllerCreatorFn = GenericCurriedFn<ControllerConnectFn>;
const controllerCreatorFactory = resourceCreatorFactory<ControllerConnectFn>();
/**
 * Generates a configurable routes controller for the application to mount. It's
 * configurable because the `creator`, instead of just being sent to the container to
 * mount, it can also be called as a function with custom parameters the controller can
 * receive.
 *
 * @param creator  A function that will generate a controller.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   const myController = controllerCreator((options = {}) => (app) => {
 *     const router = app.getRouter();
 *     const ctrl = new MyController(options);
 *     return router.get('...', ctrl.doSomething()).post('...', ctrl.doSomethingElse());
 *   });
 *
 *   // ...
 *   container.mount('/charo', myController);
 *
 * @example
 *
 * <caption>Custom parameters</caption>
 *
 *   container.mount('/pili', myController({ foo: 'bar' }));
 *
 * @group Wrappers
 */
export const controllerCreator = <CreatorFn extends ControllerCreatorFn>(
  creator: CreatorFn,
) => controllerCreatorFactory('controller', 'connect', creator);
/**
 * A resource that will define middlewares for specific routes.
 *
 * @group Wrappers
 */
export type Controller = ReturnType<typeof controller>;
/**
 * A controller creator is like a controller, but it can also be used as a function, and
 * it can receive custom parameters to configure its behavior.
 *
 * @group Wrappers
 */
export type ControllerCreator = ReturnType<typeof controllerCreator>;

// --
/**
 * The function a controller provider uses to configure/extend the container before
 * returning an actual controller.
 *
 * @param container  The reference to the Jimpex container.
 * @param route      The route on which the controller will be mounted on.
 * @group Wrappers
 */
export type ControllerProviderRegisterFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route: string,
) => Controller;

const controllerProviderFactory = resourceFactory<ControllerProviderRegisterFn>();
/**
 * Creates a "controller provider", which is a controller that can configure/extend the
 * container before the application mounts it.
 *
 * @param register  A function that will be called the moment the application mounts
 *                  the controller provider.
 * @example
 *
 *   class MyController {}
 *   const myControllerProvider = controllerProvider((app) => {
 *     app.set('myController', () => new MyController());
 *     return controller(() => {
 *       const ctrl = app.get<MyController>('myController');
 *       const router = app.getRouter();
 *       return router.get('/', ctrl.doSomething());
 *     });
 *   });
 *
 * @group Wrappers
 */
export const controllerProvider = (register: ControllerProviderRegisterFn) =>
  controllerProviderFactory('provider', 'register', register);
/**
 * A high order function that generates a controller provider. It's used on the
 * definitions of a controller provider creator.
 *
 * @group Wrappers
 */
export type ControllerProviderCreatorFn = GenericCurriedFn<ControllerProviderRegisterFn>;
const controllerProviderCreatorFactory =
  resourceCreatorFactory<ControllerProviderRegisterFn>();
/**
 * Generates a configurable controller provider for the application to mount. This is a
 * mix of a controller creator and a controller provider: it gives you the flexibility of
 * the creator, with the resources of the provider.
 *
 * @param creator  A function that will generate a controller provider.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   class MyController {}
 *   const myControllerProvider = controllerProviderCreator(
 *     ({ serviceName = 'myController' }) =>
 *       (app) => {
 *         app.set(serviceName, () => new MyController());
 *         return controller(() => {
 *           const ctrl = app.get<MyController>(serviceName);
 *           const router = app.getRouter();
 *           return router.get('/', ctrl.doSomething());
 *         });
 *       },
 *   );
 *
 *   // ...
 *   container.mount('/charo', myControllerProvider);
 *
 * @example
 *
 * <caption>Custom parameters</caption>
 *
 *   container.mount('/pili', myControllerProvider({ serviceName: 'something' }));
 *
 * @group Wrappers
 */
export const controllerProviderCreator = <CreatorFn extends ControllerProviderCreatorFn>(
  creator: CreatorFn,
) => controllerProviderCreatorFactory('provider', 'register', creator);
/**
 * A special kind of controller that can be used to configure/extend the container before
 * returning an actual controller.
 *
 * @group Wrappers
 */
export type ControllerProvider = ReturnType<typeof controllerProvider>;
/**
 * A "creator version" of a controller provider: a controller that can be used to
 * configure/extend the container before returning an actual controller, but that can also
 * be called as a function, and it can receive custom parameters to configure its
 * behavior.
 *
 * @group Wrappers
 */
export type ControllerProviderCreator = ReturnType<typeof controllerProviderCreator>;

// --
/**
 * The function a middleware uses to mount itself in the container.
 *
 * @param container  The reference to the Jimpex container.
 * @param route      This is optional because the implementation can use it as a
 *                   "global widdleware", or for a specific route.
 * @returns The resource can choose to be enabled or not by returning the function, or
 *          `undefined`.
 * @group Wrappers
 */
export type MiddlewareConnectFn = <ContainerType extends Jimpex = Jimpex>(
  app: ContainerType,
  route?: string,
) => Router | ExpressMiddlewareLike | undefined;

const middlewareFactory = resourceFactory<MiddlewareConnectFn>();
/**
 * Generates a middleware for the application container to mount.
 *
 * @param connect  A function that will be called the moment the application tries to
 *                 mount the middleware.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   const myMiddleware = controller((app) => {
 *     const responsesBuilder = app.get<ResponsesBuilder>('responsesBuilder');
 *     return (_, res) => {
 *       responsesBuilder.json({ res, data: { hello: 'world' } });
 *     };
 *   });
 *
 *   // ...
 *   container.use(myMiddleware);
 *
 * @example
 *
 * <caption>On a specific route</caption>
 *
 *   container.mount('/charo', myMiddleware);
 *
 * @group Wrappers
 */
export const middleware = (connect: MiddlewareConnectFn) =>
  middlewareFactory('middleware', 'connect', connect);
/**
 * A high order function that generates a middleware. It's used on the definitions of a
 * middleware creator.
 *
 * @group Wrappers
 */
export type MiddlewareCreatorFn = GenericCurriedFn<MiddlewareConnectFn>;
const middlewareCreatorFactory = resourceCreatorFactory<MiddlewareConnectFn>();
/**
 * Generates a configurable middleware for the application to use. It's configurable
 * because the `creator`, instead of just being sent to the container to mount, it can
 * also be called as a function with custom parameters the middleware can receive.
 *
 * @param creator  A function that will generate a middleware.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   const myMiddleware = middlewareCreator((options = {}) => (app) => {
 *     const message = options.message || 'Hello Charo!';
 *     const responsesBuilder = app.get<ResponsesBuilder>('responsesBuilder');
 *     return (_, res) => {
 *       responsesBuilder.json({ res, data: { message } });
 *     };
 *   });
 *
 *   // ...
 *   container.use(myMiddleware);
 *
 * @example
 *
 * <caption>Custom parameters</caption>
 *
 *   container.use(myMiddleware({ message: 'Hello Pili!' }));
 *
 * @group Wrappers
 */
export const middlewareCreator = <CreatorFn extends MiddlewareCreatorFn>(
  creator: CreatorFn,
) => middlewareCreatorFactory('middleware', 'connect', creator);
/**
 * A resource that will define middlewares the application can use.
 *
 * @group Wrappers
 */
export type Middleware = ReturnType<typeof middleware>;
/**
 * A middleware creator is like a middleware, but i can also be used as a function, and it
 * can receive custom parameters to configure its behavior.
 *
 * @group Wrappers
 */
export type MiddlewareCreator = ReturnType<typeof middlewareCreator>;

// --
/**
 * The function a middelware provider uses to configure/extend the container before
 * returning an actual middleware.
 *
 * @param container  The reference to the Jimpex container.
 * @param route      This is available only in the case the middleware is mounted on a
 *                   specific route.
 * @group Wrappers
 */
export type MiddlewareProviderRegisterFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route?: string,
) => Middleware;
const middlewareProviderFactory = resourceFactory<MiddlewareProviderRegisterFn>();
/**
 * Creates a "middleware provider", which is a middleware that can configure/extend the
 * container before the application uses it.
 *
 * @param register  A function that will be called the moment the application uses the
 *                  middleware provider.
 * @example
 *
 *   class MyServiceWithMiddleware {
 *     constructor(private readonly responsesBuilder: ResponsesBuilder) {}
 *     getMiddleware() {
 *       return (_, res) => {
 *         this.responsesBuilder.json({ res, data: { message } });
 *       };
 *     }
 *   }
 *
 *   const myMiddlewareProvider = middlewareProvider((app) => {
 *     app.set(
 *       'myMiddleware',
 *       () => new MyServiceWithMiddleware(app.get('responsesBuilder')),
 *     );
 *     return middleware(() =>
 *       app.get<MyServiceWithMiddleware>('myMiddleware').getMiddleware(),
 *     );
 *   });
 *
 * @group Wrappers
 */
export const middlewareProvider = (register: MiddlewareProviderRegisterFn) =>
  middlewareProviderFactory('provider', 'register', register);
/**
 * A high order function that generates a middleware provider. It's used on the
 * definitions of a middleware provider creator.
 *
 * @group Wrappers
 */
export type MiddlewareProviderCreatorFn = GenericCurriedFn<MiddlewareProviderRegisterFn>;
const middlewareProviderCreatorFactory =
  resourceCreatorFactory<MiddlewareProviderRegisterFn>();
/**
 * Generates a configurable middleware provider for the application to use. This is a mix
 * of a middleware creator and a middleware provider: it gives you the flexibility of the
 * creator, with the resources of the provider.
 *
 * @param creator  A function that will generate a middleware provider.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   class MyServiceWithMiddleware {
 *     constructor(private readonly responsesBuilder: ResponsesBuilder) {}
 *     getMiddleware() {
 *       return (_, res) => {
 *         this.responsesBuilder.json({ res, data: { message } });
 *       };
 *     }
 *   }
 *   const myMiddlewareProvider = middlewareProviderCreator(
 *     ({ serviceName = 'myMiddleware' }) =>
 *       (app) => {
 *         app.set(
 *           serviceName,
 *           () => new MyServiceWithMiddleware(app.get('responsesBuilder')),
 *         );
 *         return middleware(() =>
 *           app.get<MyServiceWithMiddleware>(serviceName).getMiddleware(),
 *         );
 *       },
 *   );
 *
 *   // ...
 *   container.use(myMiddlewareProvider);
 *
 * @example
 *
 * <caption>Custom parameters</caption>
 *
 *   container.use(myMiddlewareProvider({ serviceName: 'something' }));
 *
 * @group Wrappers
 */
export const middlewareProviderCreator = <CreatorFn extends MiddlewareProviderCreatorFn>(
  creator: CreatorFn,
) => middlewareProviderCreatorFactory('provider', 'register', creator);
/**
 * A special kind of middleware that can be used to configure/extend the container before
 * returning an actual middleware.
 *
 * @group Wrappers
 */
export type MiddlewareProvider = ReturnType<typeof middlewareProvider>;
/**
 * A "creator version" of a middleware provider: a middleware that can be used to
 * configure/extend the container before returning an actual middleware, but that can also
 * be called as a function, and it can receive custom parameters to configure its
 * behavior.
 *
 * @group Wrappers
 */
export type MiddlewareProviderCreator = ReturnType<typeof middlewareProviderCreator>;

// --
/**
 * A union types of the different kinds of middlewares that can be used by the
 * application.
 *
 * @group Wrappers
 */
export type MiddlewareLike =
  | NoStringIndex<Middleware>
  | NoStringIndex<MiddlewareProvider>
  | ExpressMiddlewareLike;
/**
 * A union types of the different kinds of controllers that can be mounted by the
 * application.
 *
 * @group Wrappers
 */
export type ControllerLike =
  | NoStringIndex<Controller>
  | NoStringIndex<ControllerProvider>
  | MiddlewareLike;
