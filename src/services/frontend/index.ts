import { providers } from '../../utils';
import { frontendFsProvider } from './frontendFs';
/**
 * Registers all the frontend services on the container.
 *
 * @group Providers
 */
export const frontendServicesProvider = providers({
  frontendFsProvider,
});

export * from './frontendFs';
