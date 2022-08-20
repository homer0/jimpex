import { middleware, type ExpressMiddleware } from '../../src';
import type { DateService } from './service';

export const dateMiddleware = middleware(
  (app) =>
    ((_, __, next) => {
      const date = app.get<DateService>('date').now();
      // eslint-disable-next-line no-console
      console.log('Request received at', date);
      next();
    }) as ExpressMiddleware,
);
