import { providers } from '../../utils';
import { htmlGeneratorProvider } from './htmlGenerator';
/**
 * Registers all the HTML services on the container.
 *
 * - {@link HTMLGenerator | htmlGenerator}
 *
 * @example
 *
 *   // Register the collection on the container
 *   container.register(htmlServicesProvider);
 *   // Getting access to one the services instance
 *   const htmlGenerator = container.get<HTMLGenerator>('htmlGenerator');
 *
 * @group Providers
 */
export const htmlServicesProvider = providers({
  htmlGeneratorProvider,
});

export * from './htmlGenerator';
