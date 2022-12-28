import { middlewareCreator } from '../../utils';
import { ExpressMiddleware, SimpleConfig } from '../../types';

export type HSTSMiddlewareOptions = {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
};

export type HSTSMiddlewarePartialOptions = Partial<HSTSMiddlewareOptions>;
export type HSTSMiddlewareSettings = HSTSMiddlewarePartialOptions & {
  enabled?: boolean;
};

export class HSTS {
  protected readonly options: HSTSMiddlewareOptions;
  protected readonly header: string;
  constructor(options: HSTSMiddlewarePartialOptions = {}) {
    this.options = {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
      ...options,
    };
    this.header = this.buildHeader();
  }

  getOptions(): Readonly<HSTSMiddlewareOptions> {
    return { ...this.options };
  }

  getHeader(): string {
    return this.header;
  }

  middleware(): ExpressMiddleware {
    return (_, res, next) => {
      res.setHeader('Strict-Transport-Security', this.header);
      next();
    };
  }

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
