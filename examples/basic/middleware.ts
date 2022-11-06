import { middleware, type ExpressMiddleware, type Logger } from '../../src';
import type { DateService } from './service';

export const dateMiddleware = middleware((app) => {
  const logger = app.get<Logger>('logger');
  const service = app.get<DateService>('date');
  const mdw: ExpressMiddleware = (_, __, next) => {
    logger.log(`Request received at ${service.now()}`);
    next();
  };

  return mdw;
});
