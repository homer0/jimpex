import { providers } from '../../utils';
import { ensureBearerTokenProvider } from './ensureBearerToken';
/**
 * Registers all the utility services on the container.
 *
 * - {@link EnsureBearerToken | ensureBearerToken}
 *
 * @example
 *
 *   // Register the collection on the container
 *   container.register(utilsServicesProvider);
 *   // Getting access to one the services instance
 *   const ensureBearerToken = container.get<EnsureBearerToken>('ensureBearerToken');
 *
 * @group Providers
 */
export const utilsServicesProvider = providers({
  ensureBearerTokenProvider,
});

export * from './ensureBearerToken';
