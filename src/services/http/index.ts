import { providers } from '../../utils';
import { apiClientProvider } from './apiClient';
import { httpProvider } from './http';
import { responsesBuilderProvider } from './responsesBuilder';
/**
 * Registers all the HTTP services on the container.
 *
 * - {@link APIClient | apiClient}
 * - {@link HTTP | http}
 * - {@link ResponsesBuilder | responsesBuilder}
 *
 * @example
 *
 *   // Register the collection on the container
 *   container.register(httpServicesProvider);
 *   // Getting access to one the services instance
 *   const apiClient = container.get<APIClient>('apiClient');
 *
 * @group Providers
 */
export const httpServicesProvider = providers({
  apiClientProvider,
  httpProvider,
  responsesBuilderProvider,
});

export * from './apiClient';
export * from './http';
export * from './responsesBuilder';
