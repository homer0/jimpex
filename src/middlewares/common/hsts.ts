import { middlewareCreator } from '../../utils';
import { ExpressMiddleware, SimpleConfig } from '../../types';
/**
 * The options to customize the HSTS header value.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security}
 * @group Middlewares/HSTS
 */
export type HSTSMiddlewareOptions = {
  /**
   * The time, in seconds, that the browser should remember that a site is only to be
   * accessed using HTTPS.
   *
   * @default 31536000
   */
  maxAge: number;
  /**
   * Whether or not the rule should apply to all sub domains.
   *
   * @default true
   */
  includeSubDomains: boolean;
  /**
   * Whether or not to include on the major browsers'
   * preload list. This directive is not part of the specification, for more information
   * about it, you should check the MDN documentation for the header.
   *
   * @default false
   */
  preload: boolean;
};
/**
 * A partial version of the {@link HSTSMiddlewareOptions}, to be used in the constructor
 * and the middleware creator.
 *
 * @group Middlewares/HSTS
 */
export type HSTSMiddlewarePartialOptions = Partial<HSTSMiddlewareOptions>;
/**
 * The options for the middleware creator that will create the middleware, or not,
 * depending on the `enabled` option.
 *
 * @group Middlewares/HSTS
 */
export type HSTSMiddlewareSettings = HSTSMiddlewarePartialOptions & {
  /**
   * If it's not `true`, it won't return the middleware.
   */
  enabled?: boolean;
};
/**
 * Generates a middleware that includes the HSTS header on the responses.
 *
 * @see {@link https://tools.ietf.org/html/rfc6797}
 * @group Middleware Classes
 * @group Middlewares/HSTS
 * @prettierignore
 */
export class HSTS {
  /**
   * The customization options for the header.
   */
  protected readonly options: HSTSMiddlewareOptions;
  /**
   * The value of the header that will be included in the responses.
   */
  protected readonly header: string;
  /**
   * @param options  The options to construct the class.
   */
  constructor(options: HSTSMiddlewarePartialOptions = {}) {
    this.options = {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
      ...options,
    };
    this.header = this.buildHeader();
  }
  /**
   * Gets the customization options.
   */
  getOptions(): Readonly<HSTSMiddlewareOptions> {
    return { ...this.options };
  }
  /**
   * Gets the value of the header that will be included in the responses.
   */
  getHeader(): string {
    return this.header;
  }
  /**
   * Generates the middleware that includes the HSTS header on the responses.
   */
  middleware(): ExpressMiddleware {
    return (_, res, next) => {
      res.setHeader('Strict-Transport-Security', this.header);
      next();
    };
  }
  /**
   * Creates the header value based on the customization options.
   */
  protected buildHeader(): string {
    const { maxAge, includeSubDomains, preload } = this.options;
    const directives = [`max-age=${maxAge}`];
    if (includeSubDomains) {
      directives.push('includeSubDomains');
    }

    if (preload) {
      directives.push('preload');
    }

    return directives.join('; ');
  }
}
/**
 * Creates the middleware that includes the HSTS header on the responses.
 *
 * @group Middlewares
 * @group Middlewares/HSTS
 */
export const hstsMiddleware = middlewareCreator(
  (options: HSTSMiddlewareSettings = {}) =>
    (app) => {
      const setting = app
        .get<SimpleConfig>('config')
        .get<HSTSMiddlewareSettings | undefined>('hsts');
      if (
        !setting?.enabled ||
        (typeof options.enabled !== 'undefined' && !options.enabled)
      )
        return undefined;
      return new HSTS(options).middleware();
    },
);
