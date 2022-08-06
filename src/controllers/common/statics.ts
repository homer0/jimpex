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
/**
 * The definition for each file the controller handles.
 */
export type StaticsControllerFile = {
  /**
   * The route, relative to the controller root, to the file.
   */
  route: string;
  /**
   * The path to the file in the filesystem. Since the file is served using the
   * {@link SendFile} service, whether the file is relative to the project root or the
   * application executable depends on how the service is configured (relative to the
   * executable by default).
   */
  path: string;
  /**
   * A dictionary of headers for the response.
   */
  headers?: Record<string, string>;
};
/**
 * These are like "master paths" that get prepended to all the file paths and routes the
 * controller use.
 */
export type StaticsControllerPathsOptions = {
  /**
   * A custom route to prefix all the file routes with.
   */
  route: string;
  /**
   * A custom path to prefix all the file paths with.
   */
  source: string;
};
/**
 * The options to customize the controller.
 */
export type StaticsControllerOptions = {
  /**
   * A list of filenames, or definitions for the files to handle.
   */
  files: Array<string | StaticsControllerFile>;
  /**
   * A dictionary with the allowed router (HTTP) methods the controller can use to serve
   * the files. If `all` is set to `true`, the rest of the values will be ignored.
   *
   * @default {get: true, all: false}
   */
  methods: Partial<Record<RouterMethod, boolean>>;
  /**
   * The "master paths" the controller can use to prefix the file paths and routes.
   *
   * @default {route: '', source: './',}
   */
  paths: StaticsControllerPathsOptions;
};
/**
 * A deep partial version of {@link StaticsControllerOptions}, used for the constructor
 * options and the controller creator options.
 */
type StaticsControllerPartialOptions = DeepPartial<StaticsControllerOptions>;
/**
 * The options to construct a {@link StaticsController}.
 */
export type StaticsControllerConstructorOptions = StaticsControllerPartialOptions & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    sendFile: SendFile;
  };
};
/**
 * A function to generate a list of middlewares that can be executed before the tontroller
 * main middleware.
 */
export type StaticsControllerGetMiddlewaresFn = (app: Jimpex) => MiddlewareLike[];
/**
 * The options for the controller creator that mounts {@link StaticsController}.
 */
export type StaticsControllerCreatorOptions = StaticsControllerPartialOptions & {
  /**
   * A function to generate a list of middlewares that can be executed before the
   * tontroller main middleware.
   */
  getMiddlewares?: StaticsControllerGetMiddlewaresFn;
};
/**
 * The options for {@link StaticsController.addRoute}.
 */
type AddRouteOptions = {
  /**
   * The reference for the router in which the middlewares will be added.
   */
  router: Router;
  /**
   * The router method in which the middlewares will be added.
   */
  method: RouterMethod;
  /**
   * The definition of the file to serve.
   */
  file: StaticsControllerFile;
  /**
   * The middleware created by {@link StaticsController}, that will serve the file.
   */
  fileMiddleware: ExpressMiddleware;
  /**
   * A list of extra middlewares to execute before the file middleware.
   */
  middlewares: ExpressMiddleware[];
};

/**
 * The controller class that allows the application to serve specific files from any
 * folder to any route without the need of mounting directories as "static".
 */
export class StaticsController {
  /**
   * The service that serves static files.
   */
  protected readonly sendFile: SendFile;
  /**
   * The controller customization options.
   */
  protected options: StaticsControllerOptions;
  /**
   * A dictionary with the formatted definitions of the files that will be served.
   * It uses the files' routes as keys, for easy access in the middleware.
   */
  protected files: Record<string, StaticsControllerFile>;
  /**
   * @param options  The options to construct the controller.
   */
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
  /**
   * Gets the controller options.
   */
  getOptions(): Readonly<StaticsControllerOptions> {
    return { ...this.options };
  }
  /**
   * Mounts the middlewares in the router in order to serve the files.
   *
   * @param router       A reference to the application router.
   * @param middlewares  A list of extra middlewares to execute before the file
   *                     middleware.
   */
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
  /**
   * Generates the middleware that will serve the file.
   *
   * @param file  The definition of the file to serve.
   */
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
  /**
   * Mounts the middleware(s) for a file in the router.
   *
   * @param options  The information of the file and how it needs to be added.
   */
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
  /**
   * Validates and formats the options sent to the constructor in order to get the final
   * set that will be stored in the controller.
   *
   * @param options  The options to validate.
   * @throws If no files are specified.
   * @throws If methods is not defined.
   * @throws If no methods are enabled.
   * @throws If there's an invalid HTTP method.
   */
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
  /**
   * Parses the files received from the constructor's options, and formats them into
   * proper definitions the controller can use.
   */
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
/**
 * A controller that allows the application to server specific files from any folder to
 * any route without the need of mounting directories as "static" folders.
 */
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
