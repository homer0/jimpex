import { createRouteExpression, middlewareCreator, removeSlashes } from '../../utils';
import type { HTMLGenerator, SendFile } from '../../services';
import type { AsyncExpressMiddleware, Response, NextFunction, Events } from '../../types';

export type FastHTMLBaseOptions = {
  file: string;
  ignoredRoutes: RegExp[];
  useAppRoutes: boolean;
};

type FastHTMLPartialOptions = Partial<FastHTMLBaseOptions>;

export type FastHTMLConstructorOptions = FastHTMLPartialOptions & {
  inject: {
    sendFile: SendFile;
    events: Events;
    getHTMLGenerator?: () => HTMLGenerator | undefined;
  };
};

export type FastHTMLMiddlewareOptions = FastHTMLPartialOptions & {
  htmlGeneratorServiceName?: string;
};

export class FastHTML {
  protected readonly sendFile: SendFile;
  protected readonly events: Events;
  protected readonly getHTMLGenerator: () => HTMLGenerator | undefined;
  protected options: FastHTMLBaseOptions;
  protected fileReady: boolean = false;
  protected routeExpressions: RegExp[] = [];
  constructor({ inject, ...options }: FastHTMLConstructorOptions) {
    this.sendFile = inject.sendFile;
    this.events = inject.events;
    this.getHTMLGenerator = inject.getHTMLGenerator || (() => undefined);
    this.options = {
      file: 'index.html',
      ignoredRoutes: [/\.ico$/i],
      useAppRoutes: true,
      ...options,
    };

    if (!this.options.ignoredRoutes.length && !this.options.useAppRoutes) {
      throw new Error('You must provide either `ignoredRoutes` or `useAppRoutes`');
    }

    if (this.options.useAppRoutes) {
      this.setupEvents();
    }
  }

  getOptions(): Readonly<FastHTMLBaseOptions> {
    return { ...this.options };
  }

  middleware(): AsyncExpressMiddleware {
    return async (req, res, next) => {
      if (this.shouldIgnoreRoute(req.originalUrl)) {
        next();
        return;
      }

      if (this.fileReady) {
        this.sendResponse(res, next);
        return;
      }

      const htmlGenerator = this.getHTMLGenerator();
      if (!htmlGenerator) {
        this.fileReady = true;
        this.sendResponse(res, next);
        return;
      }

      try {
        await htmlGenerator.whenReady();
        this.options.file = htmlGenerator.getOptions().file;
        this.fileReady = true;
        this.sendResponse(res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  protected sendResponse(res: Response, next: NextFunction): void {
    res.setHeader('Content-Type', 'text/html');
    this.sendFile({
      res,
      next,
      filepath: this.options.file,
    });
  }

  protected setupEvents() {
    this.events.once('afterStart', ({ app }) => {
      const routes = app.getRoutes();
      const [routeExpressions] = routes.reduce<[RegExp[], string[]]>(
        (acc, route) => {
          const [expressions, processed] = acc;
          const clean = removeSlashes(route).trim();
          if (!clean || processed.includes(clean)) return acc;
          expressions.push(createRouteExpression(clean));
          processed.push(clean);
          return acc;
        },
        [[], []],
      );
      this.routeExpressions.push(...routeExpressions);
    });
  }

  protected shouldIgnoreRoute(route: string): boolean {
    return (
      this.options.ignoredRoutes.some((expression) => route.match(expression)) ||
      this.routeExpressions.some((expression) => route.match(expression))
    );
  }
}

export const fastHTMLMiddleware = middlewareCreator(
  (options: FastHTMLMiddlewareOptions = {}) =>
    (app) => {
      const { htmlGeneratorServiceName = 'htmlGenerator', ...rest } = options;
      return new FastHTML({
        inject: {
          events: app.get('events'),
          sendFile: app.get('sendFile'),
          getHTMLGenerator: () => app.try(htmlGeneratorServiceName),
        },
        ...rest,
      }).middleware();
    },
);
