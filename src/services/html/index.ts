import { providers } from '../../utils';
import { htmlGeneratorProvider } from './htmlGenerator';

export const htmlServicesProvider = providers({
  htmlGeneratorProvider,
});

export * from './htmlGenerator';
