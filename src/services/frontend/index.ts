import { providers } from '../../utils';
import { frontendFsProvider } from './frontendFs';

export const frontendServicesProvider = providers({
  frontendFsProvider,
});

export * from './frontendFs';
