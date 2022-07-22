import fetch, { type RequestInit, type BodyInit } from 'node-fetch';
import urijs from 'urijs';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { provider } from '../../utils';
import { SimpleLogger, SimpleConfig, Request, HTTPResponse } from '../../types';

export type HTTPBaseOptions = {
  logRequests?: boolean;
};

export type HTTPContructorOptions = Partial<HTTPBaseOptions> & {
  inject: {
    logger: SimpleLogger;
  };
};

export type HTTPFetchBody = string | Record<string | number, unknown> | BodyInit;

export type HTTPFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: HTTPFetchBody;
  qs?: Record<string, unknown>;
  req?: Request;
};

export type GetCustomHeadersFromRequestOptions = {
  includeXForwardedHeaders?: boolean;
};

export class HTTP {
  protected readonly logger: SimpleLogger;
  protected readonly options: HTTPBaseOptions;
  constructor({ inject: { logger }, ...options }: HTTPContructorOptions) {
    this.logger = logger;
    this.options = deepAssignWithOverwrite(
      {
        logRequests: false,
      },
      options,
    );

    this.fetch = this.fetch.bind(this);
  }

  getOptions(): Readonly<HTTPBaseOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  async fetch(url: string, options: HTTPFetchOptions = {}): Promise<HTTPResponse> {
    let useURL = url;
    if (options.qs) {
      useURL = urijs(url).query(options.qs).toString();
    }

    const fetchOptions: RequestInit = {
      method: (options.method || 'get').toUpperCase(),
      body: options.body as BodyInit,
    };

    let defaultHeaders: Record<string, string> | undefined;
    if (options.req) {
      defaultHeaders = this.getCustomHeadersFromRequest(options.req);
      const ip = this.getIPFromRequest(options.req);
      if (ip) {
        defaultHeaders['x-forwarded-for'] = ip;
      }
    }
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    if (Object.keys(headers).length) {
      fetchOptions.headers = this.normalizeHeaders(headers);
    }

    const { logRequests } = this.options;
    if (logRequests) {
      this.logRequest(useURL, fetchOptions);
    }

    let result = fetch(useURL, fetchOptions);
    if (logRequests) {
      result = result.then((response) => {
        this.logResponse(response);
        return response;
      });
    }

    return result;
  }

  getIPFromRequest(req: Request): string | undefined {
    return (
      req.headers['x-forwarded-for'] ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      // @ts-expect-error -- This is valid in Node 14
      req?.connection?.socket?.remoteAddress
    );
  }

  getCustomHeadersFromRequest(
    req: Request,
    options: GetCustomHeadersFromRequestOptions = {},
  ): Record<string, string> {
    const { includeXForwardedHeaders = false } = options;
    return Object.keys(req.headers).reduce<Record<string, string>>((acc, headerName) => {
      if (
        headerName.startsWith('x-') &&
        (includeXForwardedHeaders || !headerName.startsWith('x-forwarded-'))
      ) {
        acc[headerName] = req.headers[headerName] as string;
      }
      return acc;
    }, {});
  }

  normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    return Object.keys(headers).reduce<Record<string, string>>((acc, name) => {
      const newName = name
        .split('-')
        .map((part) => part.replace(/^(\w)/, (_, letter) => letter.toUpperCase()))
        .join('-');

      acc[newName] = headers[name]!;
      return acc;
    }, {});
  }

  protected logRequest(url: string, options: RequestInit): void {
    const { method, headers } = options;
    const prefix = 'REQUEST> ';
    const lines = ['--->>', `${prefix}${method} ${url}`];
    if (headers) {
      Object.keys(headers).forEach((header) => {
        const value = headers[header as keyof typeof headers];
        lines.push(`${prefix}${header}: ${value}`);
      });
    }

    if (options.body) {
      lines.push(`${prefix}body: "${options.body}"`);
    }

    this.logger.info(lines);
  }

  protected logResponse(response: HTTPResponse) {
    const prefix = 'RESPONSE> ';
    const lines = [
      '<<---',
      `${prefix}${response.url}`,
      `${prefix}status: ${response.status}`,
    ];

    response.headers.forEach((value, header) => {
      lines.push(`${prefix}${header}: ${value}`);
    });

    this.logger.info(lines);
  }
}

export const httpProvider = provider((app) => {
  app.set('http', () => {
    const config = app.get<SimpleConfig>('config');
    const logRequests = config.get<boolean | undefined>('debug.logRequests') === true;
    return new HTTP({
      inject: {
        logger: app.get('logger'),
      },
      logRequests,
    });
  });
});
