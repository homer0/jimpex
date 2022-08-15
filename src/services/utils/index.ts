import { providers } from '../../utils';
import { ensureBearerTokenProvider } from './ensureBearerToken';
/**
 * Registers all the utility services on the container.
 *
 * @group Providers
 */
export const utilsServicesProvider = providers({
  ensureBearerTokenProvider,
});

export * from './ensureBearerToken';
