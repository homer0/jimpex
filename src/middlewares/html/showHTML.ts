import { middlewareCreator } from '../../utils';
import type { HTMLGenerator, SendFile } from '../../services';
import type { AsyncExpressMiddleware, Response, NextFunction } from '../../types';

export type ShowHTMLBaseOptions = {
  file: string;
};

type ShowHTMLPartialOptions = Partial<ShowHTMLBaseOptions>;

export type ShowHTMLConstructorOptions = ShowHTMLPartialOptions & {
  inject: {
    sendFile: SendFile;
    getHTMLGenerator?: () => HTMLGenerator | undefined;
  };
};

export type ShowHTMLMiddlewareOptions = ShowHTMLPartialOptions & {
  htmlGeneratorServiceName?: string;
};

export class ShowHTML {
  protected readonly sendFile: SendFile;
  protected readonly getHTMLGenerator: () => HTMLGenerator | undefined;
  protected options: ShowHTMLBaseOptions;
  protected fileReady: boolean = false;
  constructor({ inject, ...options }: ShowHTMLConstructorOptions) {
    this.sendFile = inject.sendFile;
    this.getHTMLGenerator = inject.getHTMLGenerator || (() => undefined);
    this.options = {
      file: 'index.html',
      ...options,
    };
  }

  getOptions(): Readonly<ShowHTMLBaseOptions> {
    return { ...this.options };
  }

  middleware(): AsyncExpressMiddleware {
    return async (_, res, next) => {
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
}

export const showHTMLMiddleware = middlewareCreator(
  (options: ShowHTMLMiddlewareOptions = {}) =>
    (app) => {
      const { htmlGeneratorServiceName = 'htmlGenerator', ...rest } = options;
      return new ShowHTML({
        inject: {
          sendFile: app.get('sendFile'),
          getHTMLGenerator: () => app.try(htmlGeneratorServiceName),
        },
        ...rest,
      }).middleware();
    },
);
