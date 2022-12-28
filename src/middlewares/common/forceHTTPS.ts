import { middlewareCreator } from '../../utils';
import { ExpressMiddleware, SimpleConfig } from '../../types';

export type ForceHTTPSOptions = {
  ignoredRoutes: RegExp[];
};

export type ForceHTTPSPartialOptions = Partial<ForceHTTPSOptions>;

export class ForceHTTPS {
  protected readonly options: ForceHTTPSOptions;
  constructor(options: ForceHTTPSPartialOptions = {}) {
    this.options = {
      ignoredRoutes: [/^\/service\//],
      ...options,
    };
  }

  getOptions(): Readonly<ForceHTTPSOptions> {
    return { ...this.options };
  }

  middleware(): ExpressMiddleware {
    return (req, res, next) => {
      if (
        !req.secure &&
        req.get('X-Forwarded-Proto') !== 'https' &&
        !this.options.ignoredRoutes.some((expression) => expression.test(req.originalUrl))
      ) {
        const host = req.get('Host');
        res.redirect(`https://${host}${req.url}`);
      } else {
        next();
      }
    };
  }
}

export const forceHTTPSMiddleware = middlewareCreator(
  (options: ForceHTTPSPartialOptions = {}) =>
    (app) => {
      const enabled = app
        .get<SimpleConfig>('config')
        .get<boolean | undefined>('forceHTTPS');
      if (!enabled) return undefined;
      return new ForceHTTPS(options).middleware();
    },
);
