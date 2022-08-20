import fetch, { type RequestInit, type BodyInit } from 'node-fetch';
import urijs from 'urijs';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { provider } from '../../utils';
import { SimpleLogger, SimpleConfig, Request, HTTPResponse } from '../../types';
/**
 * The options to customize the service.
 *
 * @group Services/HTTP
 */
export type HTTPOptions = {
  /**
   * Whether or not the service should log the requests and their responses.
   */
  logRequests?: boolean;
};
/**
 * The options to construct a {@link HTTP}.
 *
 * @group Services/HTTP
 */
export type HTTPContructorOptions = Partial<HTTPOptions> & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    logger: SimpleLogger;
  };
};
/**
 * The allowed formats for the body of a request.
 *
 * @group Services/HTTP
 */
export type HTTPFetchBody = string | Record<string | number, unknown> | BodyInit;
/**
 * The options for a request.
 *
 * @group Services/HTTP
 */
export type HTTPFetchOptions = {
  /**
   * The HTTP method.
   *
   * @default 'GET'
   */
  method?: string;
  /**
   * The headers dictionary.
   */
  headers?: Record<string, string>;
  /**
   * The body of the request.
   */
  body?: HTTPFetchBody;
  /**
   * A dictionary of query string parameters.
   */
  qs?: Record<string, unknown>;
  /**
   * A request object generated by the application. This can be used to copy information
   * like custom headers or the IP (for the X-Forwarded-For header).
   */
  req?: Request;
};
/**
 * The options for the method that extracts custom headers from a request.
 *
 * @group Services/HTTP
 */
export type GetCustomHeadersFromRequestOptions = {
  /**
   * Since the method considers all headers that start with `x-` as custom headers,
   * setting this to `false` is the only way to exclude `x-forwarded-` headers from the
   * list.
   *
   * @default false
   */
  includeXForwardedHeaders?: boolean;
};
/**
 * A set of utilities to work with HTTP requests and responses.
 *
 * @group Services
 * @group Services/HTTP
 */
export class HTTP {
  /**
   * The service used to log information in the terminal.
   */
  protected readonly _logger: SimpleLogger;
  /**
   * The service customization options.
   */
  protected readonly _options: HTTPOptions;
  /**
   * @param options  The options to construct the class.
   */
  constructor({ inject: { logger }, ...options }: HTTPContructorOptions) {
    this._logger = logger;
    this._options = deepAssignWithOverwrite(
      {
        logRequests: false,
      },
      options,
    );

    this.fetch = this.fetch.bind(this);
  }
  /**
   * Makes a fetch request.
   *
   * @param url      The URL to fetch.
   * @param options  The custom options for the request.
   */
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

    const { logRequests } = this._options;
    if (logRequests) {
      this._logRequest(useURL, fetchOptions);
    }

    const response = await fetch(useURL, fetchOptions);
    if (logRequests) {
      this._logResponse(response);
    }

    return response;
  }
  /**
   * Tries to get the IP address from a given request.
   *
   * @param req  The request from which it will try to obtain the IP address.
   */
  getIPFromRequest(req: Request): string | undefined {
    return (
      req.headers['x-forwarded-for'] ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      // @ts-expect-error -- This is valid in Node 14
      req?.connection?.socket?.remoteAddress
    );
  }
  /**
   * Creates a dictionary with all the custom headers a request has. By custom header it
   * means all the headers which name start with `x-`.
   *
   * @param req      The request from which it will try to get the headers.
   * @param options  The options to customize the behavior with certain headers.
   */
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
  /**
   * It takes a dictionary of headers and normalize the names so each word will start with
   * an upper case character. This is helpful in case you added custom headers and didn't
   * care about the casing, or when copying headers from a server request, as they all
   * come tranformed into lower case.
   *
   * @param headers  The dictionary of headers to normalize.
   */
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
  /**
   * The customization options.
   */
  get options(): Readonly<HTTPOptions> {
    return deepAssignWithOverwrite({}, this._options);
  }
  /**
   * Logs a request information into the terminal.
   *
   * @param url      The request URL.
   * @param options  The options for the request.
   */
  protected _logRequest(url: string, options: RequestInit): void {
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

    this._logger.info(lines);
  }
  /**
   * Logs a response information into the terminal.
   *
   * @param response  The response to log.
   */
  protected _logResponse(response: HTTPResponse) {
    const prefix = 'RESPONSE> ';
    const lines = [
      '<<---',
      `${prefix}${response.url}`,
      `${prefix}status: ${response.status}`,
    ];

    response.headers.forEach((value, header) => {
      lines.push(`${prefix}${header}: ${value}`);
    });

    this._logger.info(lines);
  }
}
/**
 * The service provider that once registered on the container will set an instance of
 * {@link HTTP} as the `http` service. The provider also checks the `debug.logRequests`
 * setting on the application configuration in order to enable or not the logging of
 * requests/responses.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(httpProvider);
 *   // Getting access to the service instance
 *   const http = container.get<HTTP>('http');
 *
 * @group Providers
 * @group Services/HTTP
 */
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
