import { providers } from '../../utils';
import { appErrorProvider } from './appError';
import { httpErrorProvider } from './httpError';
import { sendFileProvider } from './sendFile';

export const commonServicesProvider = providers({
  appErrorProvider,
  httpErrorProvider,
  sendFileProvider,
});

export * from './appError';
export * from './httpError';
export * from './sendFile';
