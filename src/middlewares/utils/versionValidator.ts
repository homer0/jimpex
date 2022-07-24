import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { middlewareCreator, type Statuses } from '../../utils';
import {
  DeepPartial,
  Request,
  ExpressMiddleware,
  SimpleConfig,
  Router,
} from '../../types';
import type { HTTPErrorClass, ResponsesBuilder } from '../../services';

export type VersionValidatorLatestOptions = {
  allow: boolean;
  name: string;
};

export type VersionValidatorPopupOptions = {
  variable: string;
  title: string;
  message: string;
};

export type VersionValidatorOptions = {
  latest: VersionValidatorLatestOptions;
  popup: VersionValidatorPopupOptions;
  error: string;
  version: string;
};

export type VersionValidatorPartialOptions = DeepPartial<
  Omit<VersionValidatorOptions, 'version'>
>;

export type VersionValidatorConstructorOptions = VersionValidatorPartialOptions & {
  version: string;
  inject: {
    HTTPError: HTTPErrorClass;
    responsesBuilder: ResponsesBuilder;
    statuses: Statuses;
  };
};

export type VersionValidatorMiddlewareOptions = VersionValidatorPartialOptions & {
  version?: string;
};

export class VersionValidator {
  protected readonly HTTPError: HTTPErrorClass;
  protected readonly responsesBuilder: ResponsesBuilder;
  protected readonly statuses: Statuses;
  protected readonly options: VersionValidatorOptions;

  constructor({ inject, version, ...options }: VersionValidatorConstructorOptions) {
    this.HTTPError = inject.HTTPError;
    this.responsesBuilder = inject.responsesBuilder;
    this.statuses = inject.statuses;
    this.options = deepAssignWithOverwrite(
      {
        error: "The application version doesn't match",
        latest: {
          allow: true,
          name: 'latest',
        },
        popup: {
          variable: 'popup',
          title: 'Conflict',
          message: 'vesion:conflict',
        },
        version,
      },
      options,
    );

    if (!this.options.version) {
      throw new Error('You need to supply a version');
    }
  }

  getOptions(): Readonly<VersionValidatorOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  middleware(): ExpressMiddleware {
    return (req, res, next) => {
      const { version } = req.params;
      if (!version) {
        next();
        return;
      }

      if (version === this.options.version || this.isTheAllowedLatest(version)) {
        next();
        return;
      }

      const status = this.statuses('conflict');
      if (this.isPopup(req)) {
        const { title, message } = this.options.popup;
        this.responsesBuilder.htmlPostMessage({
          res,
          title,
          message,
          status,
        });
        return;
      }

      next(
        new this.HTTPError(this.options.error, status, {
          response: {
            validation: true,
          },
        }),
      );
    };
  }

  protected isPopup(req: Request): boolean {
    const popup = req.query[this.options.popup.variable];
    return !!(popup && String(popup).toLowerCase() === 'true');
  }

  protected isTheAllowedLatest(version: string): boolean {
    const { allow, name } = this.options.latest;
    return allow && version === name;
  }
}

export const versionValidatorMiddleware = middlewareCreator(
  (options: VersionValidatorMiddlewareOptions = {}) =>
    (app, route) => {
      const version = app.get<SimpleConfig>('config').get<string>('version');
      const middleware = new VersionValidator({
        inject: {
          HTTPError: app.get('HTTPError'),
          responsesBuilder: app.get('responsesBuilder'),
          statuses: app.get('statuses'),
        },
        version,
        ...options,
      }).middleware();

      if (route) {
        const router = app.get<Router>('router');
        return router.all('/:version/*', middleware);
      }

      return middleware;
    },
);
