import * as path from 'path';
import * as mime from 'mime';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import {
  controllerCreator,
  removeSlashes,
  notUndefined,
  type MiddlewareLike,
} from '../../utils';
import type { SendFile } from '../../services';
import type { Jimpex } from '../../app';
import type { DeepPartial, ExpressMiddleware, Router, RouterMethod } from '../../types';

export type StaticsControllerFile = {
  route: string;
  path: string;
  headers?: Record<string, string>;
};

export type StaticsControllerPathsOptions = {
  route: string;
  source: string;
};

export type StaticsControllerOptions = {
  files: Array<string | StaticsControllerFile>;
  methods: Partial<Record<RouterMethod, boolean>>;
  paths: StaticsControllerPathsOptions;
};

type StaticsControllerPartialOptions = DeepPartial<StaticsControllerOptions>;

export type StaticsControllerConstructorOptions = StaticsControllerPartialOptions & {
  inject: {
    sendFile: SendFile;
  };
};

export type StaticsControllerGetMiddlewaresFn = (app: Jimpex) => MiddlewareLike[];

export type StaticsControllerCreatorOptions = StaticsControllerPartialOptions & {
  getMiddlewares?: StaticsControllerGetMiddlewaresFn;
};

type AddRouteOptions = {
  router: Router;
  method: RouterMethod;
  file: StaticsControllerFile;
  fileMiddleware: ExpressMiddleware;
  middlewares: ExpressMiddleware[];
};

export class StaticsController {
  protected readonly sendFile: SendFile;
  protected options: StaticsControllerOptions;
  protected files: Record<string, StaticsControllerFile>;
  constructor({ inject, ...options }: StaticsControllerConstructorOptions) {
    this.sendFile = inject.sendFile;
    this.options = this.validateOptions(
      deepAssignWithOverwrite(
        {
          files: ['favicon.ico', 'index.html'],
          methods: options.methods || {
            all: false,
            get: true,
          },
          paths: {
            route: '',
            source: './',
          },
        },
        options,
      ),
    );
    this.files = this.createFiles();
  }

  getOptions(): Readonly<StaticsControllerOptions> {
    return { ...this.options };
  }

  addRoutes(router: Router, middlewares: ExpressMiddleware[] = []): Router {
    const { methods } = this.options;
    const use: RouterMethod[] = methods.all
      ? ['all']
      : Object.keys(methods).reduce<RouterMethod[]>((acc, name) => {
          const methodName = name as RouterMethod;
          if (methods[methodName]) {
            acc.push(methodName);
          }

          return acc;
        }, []);

    Object.keys(this.files).forEach((route) => {
      const file = this.files[route as keyof typeof this.files]!;
      const fileMiddleware = this.getMiddleware(file);
      use.forEach((method) =>
        this.addRoute({ router, method, file, fileMiddleware, middlewares }),
      );
    });

    return router;
  }

  protected getMiddleware(file: StaticsControllerFile): ExpressMiddleware {
    return (_, res, next) => {
      const extension = path.parse(file.path).ext.substring(1);
      const headers = {
        'Content-Type': mime.getType(extension) || 'text/html',
        ...file.headers,
      };

      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      this.sendFile({
        res,
        filepath: file.path,
        next,
      });
    };
  }

  protected addRoute({
    router,
    method,
    file,
    fileMiddleware,
    middlewares,
  }: AddRouteOptions): void {
    const { route } = file;
    router[method](route, [...middlewares, fileMiddleware]);
  }

  protected validateOptions(options: StaticsControllerOptions): StaticsControllerOptions {
    if (!options.files || !options.files.length) {
      throw new Error('You need to specify a list of files');
    }

    if (!options.methods) {
      throw new Error('You need to specify which HTTP methods are allowed for the files');
    }

    const methods = Object.keys(options.methods) as RouterMethod[];

    const atLeastOne = methods.some((method) => options.methods[method]);
    if (!atLeastOne) {
      throw new Error('You need to enable at least one HTTP method to serve the files');
    }

    const allowedMethods: RouterMethod[] = [
      'all',
      'get',
      'head',
      'post',
      'patch',
      'put',
      'delete',
      'connect',
      'options',
      'trace',
    ];

    const invalid = methods.find(
      (method) => !allowedMethods.includes(method.toLowerCase() as RouterMethod),
    );

    if (invalid) {
      throw new Error(`${invalid} is not a valid HTTP method`);
    }

    const newMethods = methods.reduce<Record<string, boolean>>((acc, method) => {
      acc[method.toLowerCase()] = !!options.methods[method];
      return acc;
    }, {});

    return {
      ...options,
      methods: newMethods,
    };
  }

  protected createFiles(): Record<string, StaticsControllerFile> {
    const { files, paths } = this.options;
    const routePath = removeSlashes(paths.route, false, true);
    return files.reduce<Record<string, StaticsControllerFile>>((acc, file) => {
      let src;
      let route;
      let headers;
      if (typeof file === 'object') {
        ({ route, path: src, headers } = file);
      } else {
        src = file;
        route = file;
      }

      src = path.join(paths.source, src);
      route = removeSlashes(route, true, false);
      route = `${routePath}/${route}`;
      acc[route] = {
        path: src,
        route,
        headers: headers || {},
      };

      return acc;
    }, {});
  }
}

export const staticsController = controllerCreator(
  ({ getMiddlewares, ...options }: StaticsControllerCreatorOptions = {}) =>
    (app) => {
      const router = app.get<Router>('router');
      const ctrl = new StaticsController({
        inject: {
          sendFile: app.get('sendFile'),
        },
        ...options,
      });

      let useMiddlewares: ExpressMiddleware[] | undefined;
      if (getMiddlewares) {
        useMiddlewares = getMiddlewares(app)
          .map((middleware) => {
            if ('middleware' in middleware) {
              return middleware.connect(app) as ExpressMiddleware | undefined;
            }

            return middleware as ExpressMiddleware;
          })
          .filter(notUndefined);
      }

      return ctrl.addRoutes(router, useMiddlewares);
    },
);
