import { middlewareCreator } from '../../utils';
import { ExpressMiddleware, SimpleConfig } from '../../types';
/**
 * The customization options for the middleware.
 */
export type ForceHTTPSOptions = {
  /**
   * A list of regular expressions to match routes that should be ignored.
   *
   * @default [/^\/service\//]
   */
  ignoredRoutes: RegExp[];
};
/**
 * A partial version of the {@link ForceHTTPSOptions}, to be used int he constructor and
 * the middleware creator.
 */
export type ForceHTTPSPartialOptions = Partial<ForceHTTPSOptions>;
/**
 * Creates a middleware that forces all the traffic to be through HTTPS.
 */
export class ForceHTTPS {
  /**
   * The customization options.
   */
  protected readonly options: ForceHTTPSOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor(options: ForceHTTPSPartialOptions = {}) {
    this.options = {
      ignoredRoutes: [/^\/service\//],
      ...options,
    };
  }
  /**
   * Gets the customization options.
   */
  getOptions(): Readonly<ForceHTTPSOptions> {
    return { ...this.options };
  }
  /**
   * Generates the middleware that redirects the traffic.
   */
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
/**
 * Creates the middleware that redirects the traffic to HTTPS.
 */
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
