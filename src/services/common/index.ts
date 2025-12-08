import { providers } from '../../utils/index.js';
import { appErrorProvider } from './appError.js';
import { httpErrorProvider } from './httpError.js';
import { sendFileProvider } from './sendFile.js';
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

export * from './appError.js';
export * from './httpError.js';
export * from './sendFile.js';
