import { providers } from '../../utils';
import { appErrorProvider } from './appError';
import { httpErrorProvider } from './httpError';

export default providers({
  appErrorProvider,
  httpErrorProvider,
});

export * from './appError';
export * from './httpError';
