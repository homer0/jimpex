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
import type { Router, Middleware } from '../types';

export type ProviderRegisterFn = OriginalProviderRegisterFn<Jimpex>;
export const provider = createProvider<Jimpex>();
export const providerCreator = createProviderCreator<Jimpex>();
export const providers = createProviders<Jimpex>();

export type ControllerConnectFn = <ContainerType extends Jimpex = Jimpex>(
  container: ContainerType,
  route: string,
) => Router | undefined;

const controllerFactory = resourceFactory<ControllerConnectFn>();
export const controller = (connect: ControllerConnectFn) =>
  controllerFactory('controller', 'connect', connect);

export type ControllerCreatorFn = GenericCurriedFn<ControllerConnectFn>;
const controllerCreatorFactory = resourceCreatorFactory<ControllerConnectFn>();
export const controllerCreator = <CreatorFn extends ControllerCreatorFn>(
  creator: CreatorFn,
) => controllerCreatorFactory('controller', 'connect', creator);

export type MiddlewareConnectFn = <ContainerType extends Jimpex = Jimpex>(
  app: ContainerType,
) => Middleware | undefined;

const middlewareFactory = resourceFactory<MiddlewareConnectFn>();
export const middleware = (connect: MiddlewareConnectFn) =>
  middlewareFactory('middleware', 'connect', connect);

export type MiddlewareCreatorFn = GenericCurriedFn<MiddlewareConnectFn>;
const middlewareCreatorFactory = resourceCreatorFactory<MiddlewareConnectFn>();
export const middlewareCreator = <CreatorFn extends MiddlewareCreatorFn>(
  creator: CreatorFn,
) => middlewareCreatorFactory('middleware', 'connect', creator);
