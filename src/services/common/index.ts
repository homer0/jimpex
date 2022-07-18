import { providers } from '../../utils';
import { appError } from './appError';
import { httpError } from './httpError';

export default providers({
  appError,
  httpError,
});

export * from './appError';
export * from './httpError';
