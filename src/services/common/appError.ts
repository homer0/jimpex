import { provider } from '../../app/resources';
import { statuses as statusesFn, type Statuses } from '../../utils';

export type AppErrorContext = {
  response?: unknown;
  status?: string | number;
} & Record<string, unknown>;

export class AppError extends Error {
  readonly date: Date;
  readonly context: AppErrorContext;
  protected statuses: Statuses;

  constructor(
    message: string,
    context: AppErrorContext = {},
    statuses: Statuses = statusesFn,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.date = new Date();
    this.statuses = statuses;
    this.context = this.parseContext(context);

    // Limit the stack trace if possible.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  getResponse<T>(): T {
    return this.response as T;
  }

  get response(): unknown {
    return this.context.response;
  }

  get status(): number | undefined {
    return this.context.status as number | undefined;
  }

  protected parseContext(context: AppErrorContext): AppErrorContext {
    const result = { ...context };
    if (result.status && typeof result.status === 'string') {
      result.status = this.statuses(result.status.toLowerCase());
    }

    return result;
  }
}

export const createAppError = (
  ...args: ConstructorParameters<typeof AppError>
): AppError => new AppError(...args);

export type CreateAppErrorFn = typeof createAppError;

export const appError = provider((app) => {
  app.set('AppError', () => AppError);
  app.set('appError', () => createAppError);
});
