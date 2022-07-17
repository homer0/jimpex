import { provider } from '../../app/resources';
import { statuses as statusesFn, type Statuses } from '../../utils';
import { AppError, type AppErrorContext } from './appError';

export class HTTPError extends AppError {
  constructor(
    message: string,
    status: number | string = statusesFn('ok'),
    context: AppErrorContext = {},
    statuses: Statuses = statusesFn,
  ) {
    super(message, { ...context, status }, statuses);
  }
}

export const createHTTPError = (
  ...args: ConstructorParameters<typeof HTTPError>
): HTTPError => new HTTPError(...args);

export type CreateHTTPErrorFn = typeof createHTTPError;

export const httpError = provider((app) => {
  app.set('HTTPError', () => HTTPError);
  app.set('httpError', () => createHTTPError);
});
