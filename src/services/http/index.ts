import { providers } from '../../utils/index.js';
import { apiClientProvider } from './apiClient.js';
import { httpProvider } from './http.js';
import { responsesBuilderProvider } from './responsesBuilder.js';
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

export * from './apiClient.js';
export * from './http.js';
export * from './responsesBuilder.js';
