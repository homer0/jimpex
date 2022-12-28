import { provider } from '../../src';

export class DateService {
  now(): Date {
    return new Date();
  }
}

export const dateServiceProvider = provider((app) => {
  app.set('date', () => new DateService());
});
