import { providers } from '../../utils/index.js';
import { frontendFsProvider } from './frontendFs.js';
/**
 * Registers all the frontend services on the container.
 *
 * - {@link FrontendFs | frontendFs}
 *
 * @example
 *
 *   // Register the collection on the container
 *   container.register(frontendServicesProvider);
 *   // Getting access to one the services instance
 *   const frontendFs = container.get<FrontendFs>('frontendFs');
 *
 * @group Providers
 */
export const frontendServicesProvider = providers({
  frontendFsProvider,
});

export * from './frontendFs.js';
