import { providers } from '../../utils';
import { htmlGeneratorProvider } from './htmlGenerator';
/**
 * Registers all the HTML services on the container.
 *
 * @group Providers
 */
export const htmlServicesProvider = providers({
  htmlGeneratorProvider,
});

export * from './htmlGenerator';
