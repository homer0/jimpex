import {
  createRouteExpression,
  middlewareCreator,
  removeSlashes,
} from '../../utils/index.js';
import type { HTMLGenerator, SendFile } from '../../services/index.js';
import type {
  AsyncExpressMiddleware,
  Response,
  NextFunction,
  Events,
} from '../../types/index.js';
/**
 * The options to customize the behavior of the middleware.
 *
 * @group Middlewares/FastHTML
 */
export type FastHTMLOptions = {
  /**
   * The name of the file the middleware will serve. If the {@link HTMLGenerator} service
   * is available, it will be overridden by the service.
   *
   * @default 'index.html'
   */
  file: string;
  /**
   * A list of regular expressions to match request paths that should be ignored by the
   * middleware.
   *
   * @default [/\.ico$/i]
   */
  ignoredRoutes: RegExp[];
  /**
   * If `true`, {@link FastHTML} will get the list of all the routes controlled by the
   * application, and will use them to validate the incoming requests (in addition to the
   * `ignore` list): If a request URL doesn't match with any of the "controlled routes",
   * it will serve the HTML file.
   *
   * @default true
   */
  useAppRoutes: boolean;
};
/**
 * The options to construct a {@link FastHTML}.
 *
 * @group Middlewares/FastHTML
 */
export type FastHTMLConstructorOptions = Partial<FastHTMLOptions> & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    sendFile: SendFile;
    events: Events;
    /**
     * A function to get a possible {@link HTMLGenerator}. This is injected as a "getter"
     * to not interrupt the DIC "lifecycle": middlewares are initialized right when the
     * app starts, and injecting a reference would force the service to be initialized
     * too, even if a request is not being made.
     */
    getHTMLGenerator?: () => HTMLGenerator | undefined;
  };
};
/**
 * The options for the middleware creator that will mount an instance of {@link FastHTML}.
 *
 * @group Middlewares/FastHTML
 */
export type FastHTMLMiddlewareOptions = Partial<FastHTMLOptions> & {
  /**
   * The name of an {@link HTMLGenerator} service already available in the application.
   *
   * @default 'htmlGenerator'
   */
  htmlGeneratorServiceName?: string;
};
/**
 * It's common for an app to show an HTML view when no route was able to handle a request,
 * so the idea behind this middleware is to avoid going to every middleware and controller
 * and just specify that if the request is not for a route handled by a controller, just
 * serve the HTML and avoid processing unnecessary data.
 *
 * A simple example: The app has a route `/backend` that a frontend uses to get
 * information.
 * This middleware can be used to only allow the execution of middlewares and controllers
 * when the request route is for `/backend`.
 *
 * **Disclaimer**: Managing statics files with Express is not a best practice, but there
 * are scenarios where there is not other choice.
 *
 * @group Middleware Classes
 * @group Middlewares/FastHTML
 * @prettierignore
 */
export class FastHTML {
  /**
   * The service that serves a file.
   */
  protected readonly _sendFile: SendFile;
  /**
   * The application event bus, to listen and get the list of "controlled routes" after
   * the application is started.
   */
  protected readonly _events: Events;
  /**
   * A function to get a possible {@link HTMLGenerator}. This is injected as a "getter"
   * to not interrupt the DIC "lifecycle": middlewares are initialized right when the
   * app starts, and injecting a reference would force the service to be initialized
   * too, even if a request is not being made.
   */
  protected readonly _getHTMLGenerator: () => HTMLGenerator | undefined;
  /**
   * The customization options for the middleware.
   */
  protected _options: FastHTMLOptions;
  /**
   * Whether or not the file is ready to be served. In case the middleware uses an
   * {@link HTMLGenerator} service, the file needs to be generated before being available,
   * and that's why this flag exists.
   */
  protected _fileReady: boolean = false;
  /**
   * A list of regular expression that match the routes controlled by the application.
   * This is in case the `useAppRoutes` option is set to `true`; when the application gets
   * started, an event listener will obtain all the top controlled routes, create regular
   * expressions, and save them on this property.
   */
  protected _routeExpressions: RegExp[] = [];
  /**
   * @param options  The options to construct the class.
   * @throws If `ignoredRoutes` is empty and `useAppRoutes` is set to `false`.
   */
  constructor({ inject, ...options }: FastHTMLConstructorOptions) {
    this._sendFile = inject.sendFile;
    this._events = inject.events;
    this._getHTMLGenerator = inject.getHTMLGenerator || (() => undefined);
    this._options = {
      file: 'index.html',
      ignoredRoutes: [/\.ico$/i],
      useAppRoutes: true,
      ...options,
    };

    if (!this._options.ignoredRoutes.length && !this._options.useAppRoutes) {
      throw new Error('You must provide either `ignoredRoutes` or `useAppRoutes`');
    }

    if (this._options.useAppRoutes) {
      this._setupEvents();
    }
  }
  /**
   * Generates the middleware that serves the HTML file.
   */
  getMiddleware(): AsyncExpressMiddleware {
    return async (req, res, next) => {
      // If the route should be ignored, move to the next middleware.
      if (this._shouldIgnoreRoute(req.originalUrl)) {
        next();
        return;
      }

      // If the file is ready to be served, serve it.
      if (this._fileReady) {
        this._sendResponse(res, next);
        return;
      }

      const htmlGenerator = this._getHTMLGenerator();
      // If there's no generator, switch the flag and just serve the file.
      if (!htmlGenerator) {
        this._fileReady = true;
        this._sendResponse(res, next);
        return;
      }

      try {
        // Wait for the HTML to be generated.
        await htmlGenerator.whenReady();
        // Update the local option.
        this._options.file = htmlGenerator.options.file;
        // Switch the flag and serve the file.
        this._fileReady = true;
        this._sendResponse(res, next);
      } catch (error) {
        next(error);
      }
    };
  }
  /**
   * The customization options.
   */
  get options(): Readonly<FastHTMLOptions> {
    return { ...this._options };
  }
  /**
   * Serves the HTML file to the response.
   *
   * @param res   The response object generated by the application.
   * @param next  The function to call the next middleware.
   */
  protected _sendResponse(res: Response, next: NextFunction): void {
    res.setHeader('Content-Type', 'text/html');
    this._sendFile({
      res,
      next,
      filepath: this._options.file,
    });
  }
  /**
   * Adds the event listener that obtains the list of "controlled routes" when
   * `useAppRoutes` is set to `true`.
   */
  protected _setupEvents() {
    this._events.once('afterStart', ({ app }) => {
      const [routeExpressions] = app.routes.reduce<[RegExp[], string[]]>(
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
      this._routeExpressions.push(...routeExpressions);
    });
  }
  /**
   * Validates whether a route should be ignored or not. The method checks first against
   * the `ignore` option, and then against the list of "controlled routes" if
   * `useAppRoutes` is set to `true`.
   *
   * @param route  The route to validate.
   */
  protected _shouldIgnoreRoute(route: string): boolean {
    return (
      this._options.ignoredRoutes.some((expression) => route.match(expression)) ||
      this._routeExpressions.some((expression) => route.match(expression))
    );
  }
}
/**
 * Creates the middleware that filters the routes and serves an HTML before the
 * application gets to evaluate whether there's a controller for the request or not.
 *
 * @group Middlewares
 * @group Middlewares/FastHTML
 */
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
      }).getMiddleware();
    },
);
