import { middlewareCreator } from '../../utils';
import { ExpressMiddleware, Config } from '../../types';
/**
 * The customization options for the middleware.
 *
 * @group Middlewares/ForceHTTPS
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
 * A partial version of the {@link ForceHTTPSOptions}, to be used in the constructor and
 * the middleware creator.
 *
 * @group Middlewares/ForceHTTPS
 */
export type ForceHTTPSPartialOptions = Partial<ForceHTTPSOptions>;
/**
 * Creates a middleware that forces all the traffic to be through HTTPS.
 *
 * @group Middleware Classes
 * @group Middlewares/ForceHTTPS
 * @prettierignore
 */
export class ForceHTTPS {
  /**
   * The customization options.
   */
  protected readonly _options: ForceHTTPSOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor(options: ForceHTTPSPartialOptions = {}) {
    this._options = {
      ignoredRoutes: [/^\/service\//],
      ...options,
    };
  }
  /**
   * Generates the middleware that redirects the traffic.
   */
  getMiddleware(): ExpressMiddleware {
    return (req, res, next) => {
      if (
        !req.secure &&
        req.get('X-Forwarded-Proto') !== 'https' &&
        !this._options.ignoredRoutes.some((expression) =>
          expression.test(req.originalUrl),
        )
      ) {
        const host = req.get('Host');
        res.redirect(`https://${host}${req.url}`);
      } else {
        next();
      }
    };
  }
  /**
   * The customization options.
   */
  get options(): Readonly<ForceHTTPSOptions> {
    return { ...this._options };
  }
}
/**
 * Creates the middleware that redirects the traffic to HTTPS.
 *
 * @group Middlewares
 * @group Middlewares/ForceHTTPS
 */
export const forceHTTPSMiddleware = middlewareCreator(
  (options: ForceHTTPSPartialOptions = {}) =>
    (app) => {
      const enabled = app.get<Config>('config').get<boolean | undefined>('forceHTTPS');
      if (!enabled) return undefined;
      return new ForceHTTPS(options).getMiddleware();
    },
);
