import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { providerCreator, type Statuses } from '../../utils';
import type { HTTPErrorClass } from '../common';
import type { DeepPartial, ExpressMiddleware } from '../../types';

export type EnsureBearerTokenErrorOptions = {
  message: string;
  status: number;
  response: unknown;
};

export type EnsureBearerTokenOptions = {
  error: EnsureBearerTokenErrorOptions;
  expression: RegExp;
  local: string;
};

type EnsureBearerTokenPartialOptions = DeepPartial<EnsureBearerTokenOptions>;

export type EnsureBearerConstructorOptions = EnsureBearerTokenPartialOptions & {
  inject: {
    HTTPError: HTTPErrorClass;
    statuses: Statuses;
  };
};

export type EnsureBearerTokenProviderOptions = EnsureBearerTokenPartialOptions & {
  serviceName?: string;
};

export class EnsureBearerToken {
  protected readonly HTTPError: HTTPErrorClass;
  protected readonly options: EnsureBearerTokenOptions;
  constructor({
    inject: { HTTPError, statuses },
    ...options
  }: EnsureBearerConstructorOptions) {
    this.HTTPError = HTTPError;
    this.options = deepAssignWithOverwrite(
      {
        error: {
          message: 'Unauthorized',
          status: statuses('unauthorized'),
          response: {},
        },
        expression: /bearer (.*?)(?:$|\s)/i,
        local: 'token',
      },
      options,
    );
  }

  getOptions(): Readonly<EnsureBearerTokenOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  middleware(): ExpressMiddleware {
    return (req, res, next) => {
      let unauthorized = true;
      const {
        headers: { authorization },
      } = req;
      if (authorization) {
        const matches = this.options.expression.exec(authorization);
        if (matches) {
          const [, token] = matches;
          res.locals[this.options.local] = token;
          unauthorized = false;
        }
      }

      if (unauthorized) {
        const {
          error: { message, status, response },
        } = this.options;
        next(
          new this.HTTPError(message, status, {
            response,
          }),
        );
      } else {
        next();
      }
    };
  }
}

export const ensureBearerTokenProvider = providerCreator(
  (options: EnsureBearerTokenProviderOptions = {}) =>
    (app) => {
      const { serviceName = 'ensureBearerToken', ...rest } = options;
      app.set(serviceName, () =>
        new EnsureBearerToken({
          inject: {
            HTTPError: app.get('HTTPError'),
            statuses: app.get('statuses'),
          },
          ...rest,
        }).middleware(),
      );
    },
);
