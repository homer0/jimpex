import { providers } from '../../utils';
import { apiClientProvider } from './apiClient';
import { httpProvider } from './http';
import { responsesBuilderProvider } from './responsesBuilder';

export const httpServicesProvider = providers({
  apiClientProvider,
  httpProvider,
  responsesBuilderProvider,
});

export * from './apiClient';
export * from './http';
export * from './responsesBuilder';
