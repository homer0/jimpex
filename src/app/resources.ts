import {
  createProvider,
  createProviderCreator,
  createProviders,
  resourceFactory,
  type ProviderRegisterFn as OriginalProviderRegisterFn,
  type GenericCurriedFn,
  resourceCreatorFactory,
} from '@homer0/jimple';
import type { Jimpex } from './jimpex';
import type { Router, ExpressMiddleware } from '../types';

export type ProviderRegisterFn = OriginalProviderRegisterFn<Jimpex>;
export const provider = createProvider<Jimpex>();
export const providerCreator = createProviderCreator<Jimpex>();
export const providers = createProviders<Jimpex>();
export type Provider = ReturnType<typeof provider>;
export type ProviderCreator = ReturnType<typeof providerCreator>;
export type Providers = ReturnType<typeof providers>;
export type ProviderLike = Provider | ProviderCreator | Providers;

// --

export type ControllerConnectFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route: string,
) => Router;

const controllerFactory = resourceFactory<ControllerConnectFn>();
export const controller = (connect: ControllerConnectFn) =>
  controllerFactory('controller', 'connect', connect);

export type ControllerCreatorFn = GenericCurriedFn<ControllerConnectFn>;
const controllerCreatorFactory = resourceCreatorFactory<ControllerConnectFn>();
export const controllerCreator = <CreatorFn extends ControllerCreatorFn>(
  creator: CreatorFn,
) => controllerCreatorFactory('controller', 'connect', creator);

export type Controller = ReturnType<typeof controller>;
export type ControllerCreator = ReturnType<typeof controllerCreator>;

// --

export type ControllerProviderRegisterFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route: string,
) => Controller;

const controllerProviderFactory = resourceFactory<ControllerProviderRegisterFn>();
export const controllerProvider = (register: ControllerProviderRegisterFn) =>
  controllerProviderFactory('provider', 'register', register);

export type ControllerProviderCreatorFn = GenericCurriedFn<ControllerProviderRegisterFn>;
const controllerProviderCreatorFactory =
  resourceCreatorFactory<ControllerProviderRegisterFn>();
export const controllerProviderCreator = <CreatorFn extends ControllerProviderCreatorFn>(
  creator: CreatorFn,
) => controllerProviderCreatorFactory('provider', 'register', creator);

export type ControllerProvider = ReturnType<typeof controllerProvider>;
export type ControllerProviderCreator = ReturnType<typeof controllerProviderCreator>;

// --

export type MiddlewareConnectFn = <ContainerType extends Jimpex = Jimpex>(
  app: ContainerType,
) => ExpressMiddleware | undefined;

const middlewareFactory = resourceFactory<MiddlewareConnectFn>();
export const middleware = (connect: MiddlewareConnectFn) =>
  middlewareFactory('middleware', 'connect', connect);

export type MiddlewareCreatorFn = GenericCurriedFn<MiddlewareConnectFn>;
const middlewareCreatorFactory = resourceCreatorFactory<MiddlewareConnectFn>();
export const middlewareCreator = <CreatorFn extends MiddlewareCreatorFn>(
  creator: CreatorFn,
) => middlewareCreatorFactory('middleware', 'connect', creator);

export type Middleware = ReturnType<typeof middleware>;
export type MiddlewareCreator = ReturnType<typeof middlewareCreator>;

// --

export type MiddlewareProviderRegisterFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
) => Middleware;

const middlewareProviderFactory = resourceFactory<MiddlewareProviderRegisterFn>();
export const middlewareProvider = (register: MiddlewareProviderRegisterFn) =>
  middlewareProviderFactory('provider', 'register', register);

export type MiddlewareProviderCreatorFn = GenericCurriedFn<MiddlewareProviderRegisterFn>;
const middlewareProviderCreatorFactory =
  resourceCreatorFactory<MiddlewareProviderRegisterFn>();
export const middlewareProviderCreator = <CreatorFn extends MiddlewareProviderCreatorFn>(
  creator: CreatorFn,
) => middlewareProviderCreatorFactory('provider', 'register', creator);

export type MiddlewareProvider = ReturnType<typeof middlewareProvider>;
export type MiddlewareProviderCreator = ReturnType<typeof middlewareProviderCreator>;

// --

export type ControllerLike = Controller | ControllerProvider;
export type MiddlewareLike = Middleware | MiddlewareProvider;
