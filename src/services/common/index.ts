import { providers } from '../../utils';
import { appErrorProvider } from './appError';
import { httpErrorProvider } from './httpError';
import { sendFileProvider } from './sendFile';
/**
 * Registers all the common services on the container.
 *
 * - {@link AppError | appError}
 * - {@link HTTPError | httpError}
 * - {@link SendFile | sendFile}
 *
 * @example
 *
 *   // Register the collection on the container
 *   container.register(commonServicesProvider);
 *   // Getting access to one the services instance
 *   const sendFile = container.get<SendFile>('sendFile');
 *
 * @group Providers
 */
export const commonServicesProvider = providers({
  appErrorProvider,
  httpErrorProvider,
  sendFileProvider,
});

export * from './appError';
export * from './httpError';
export * from './sendFile';
