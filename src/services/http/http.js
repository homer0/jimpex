const fetch = require('node-fetch');
const urijs = require('urijs');
const { provider } = require('../../utils/wrappers');
/**
 * @typedef {Object} HTTPFetchOptions
 * @property {?string}         method  The request method.
 * @property {?Object}         headers The request headers.
 * @property {?string}         body    The request body.
 * @property {?Object}         qs      The request query string parameters.
 * @property {?ExpressRequest} req     An Express request object used to get extra infromation
 *                                     (like headers and the IP).
 */
/**
 * @external Headers
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Headers
 */
/**
 * A set of utilities to work with HTTP requests and responses.
 */
class HTTP {
  /**
   * @param {boolean} logRequests Whether or not to log the requests and their responses.
   * @param {Logger}  appLogger   If `logRequests` is `true`, this will be used to log the requests
   *                              and responses information.
   */
  constructor(logRequests, appLogger) {
    /**
     * Whether or not to log the requests and their responses.
     *
     * @type {boolean}
     * @access protected
     * @ignore
     */
    this._logRequests = logRequests;
    /**
     * A local reference for the `appLogger` service.
     *
     * @type {AppLogger}
     * @access protected
     * @ignore
     */
    this._appLogger = appLogger;
    /**
     * So it can be sent to other services as a reference.
     *
     * @ignore
     */
    this.fetch = this.fetch.bind(this);
  }
  /**
   * Make a request.
   *
   * @param {string}           url          The request URL.
   * @param {HTTPFetchOptions} [options={}] The request options.
   * @returns {Promise<Object,Error>}
   */
  fetch(url, options = {}) {
    // Get a mutable reference for the URL.
    let fetchURL = url;
    // If there are query string parameters...
    if (options.qs) {
      // ...use `urijs` to inject them on the URL reference.
      fetchURL = urijs(url).addSearch(options.qs).toString();
    }
    // Define an object that will hold the new set of options.
    const fetchOptions = {
      // Set the request method and make it fallback to `GET` if it wasn't set.
      method: (options.method || 'get').toUpperCase(),
    };
    // If there's a body, add it to the new options.
    if (options.body) {
      fetchOptions.body = options.body;
    }
    // Define the base headers for the request.
    let defaultHeaders = {};
    // If there's an Express request object on the `options`...
    if (options.req) {
      /**
       * Overwrite the base headers with the request original IP as `x-forwarded-for` and all the
       * received custom headers that request may have.
       */
      defaultHeaders = {
        'x-forwarded-for': this.getIPFromRequest(options.req),
        ...this.getCustomHeadersFromRequest(options.req),
      };
    }
    // Merge the base headers with the ones received on the `options`.
    const headers = {
      ...defaultHeaders,
      ...(options.headers || {}),
    };
    /**
     * If there's at least one header on the dictionary, add it to the new options. This check is
     * to avoid sending an empty object.
     */
    if (Object.keys(headers).length) {
      fetchOptions.headers = this.normalizeHeaders(headers);
    }
    // If the `logRequests` flag is `true`, call the method to log the request.
    if (this._logRequests) {
      this._logRequest(fetchURL, fetchOptions);
    }
    // Make the request.
    let result = fetch(fetchURL, fetchOptions);
    // If the `logRequests` flag is `true`...
    if (this._logRequests) {
      // Add an extra step on the promise chain to log the response.
      result = result.then((response) => {
        this._logResponse(response);
        return response;
      });
    }
    // Return the request promise.
    return result;
  }
  /**
   * Creates a dictionary with all the custom headers a request has. By custom header it means all
   * the headers which name start with `x-`.
   * This method doesn't copy `x-forwarded-for` as the `fetch` method generates it by calling
   * `getIPFromRequest`.
   *
   * @param {ExpressRequest} req The request from which it will try to get the headers.
   * @returns {Object}
   */
  getCustomHeadersFromRequest(req) {
    const headers = {};
    Object.keys(req.headers).forEach((headerName) => {
      if (headerName.startsWith('x-') && !headerName.startsWith('x-forwarded-for')) {
        headers[headerName] = req.headers[headerName];
      }
    });

    return headers;
  }
  /**
   * Try to get the IP from a given request.
   *
   * @param {ExpressRequest} req The request from which it will try to obtain the IP address.
   * @returns {?string}
   */
  getIPFromRequest(req) {
    return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  }
  /**
   * It takes a dictionary of headers and normalize the names so each word will start with an
   * upper case character. This is helpful in case you added custom headers and didn't care about
   * the casing, or when copying headers from a server request, in which case they are all
   * tranformed to lower case.
   *
   * @param {Object} headers The dictionary of headers to normalize.
   * @returns {Object}
   */
  normalizeHeaders(headers) {
    return Object.keys(headers).reduce(
      (newHeaders, name) => {
        const newName = name
        .split('-')
        .map((part) => part.replace(/^(\w)/, (ignore, letter) => letter.toUpperCase()))
        .join('-');
        return {
          ...newHeaders,
          [newName]: headers[name],
        };
      },
      {},
    );
  }
  /**
   * Whether or not to log the requests and their responses.
   *
   * @type {boolean}
   */
  get logRequests() {
    return this._logRequests;
  }
  /**
   * Log a a request information using the `appLogger` service.
   *
   * @param {string}  url            The request URL.
   * @param {Object}  options        The options generated by the `fetch` method.
   * @param {string}  options.method The request method.
   * @param {?Object} options.header The request headers.
   * @param {?string} options.body   The request body.
   */
  _logRequest(url, options) {
    const prefix = 'REQUEST> ';
    const lines = [
      '--->>',
      `${prefix}${options.method} ${url}`,
    ];
    if (options.headers) {
      Object.keys(options.headers).forEach((header) => {
        lines.push(`${prefix}${header}: ${options.headers[header]}`);
      });
    }

    if (options.body) {
      lines.push(`${prefix}body: "${options.body}"`);
    }

    this._appLogger.info(lines);
  }
  /**
   * Log a a response information using the `appLogger` service.
   *
   * @param {Object}  response         The response object returned by `node-fetch`.
   * @param {string}  response.url     The requested URL.
   * @param {number}  response.status  The response HTTP status.
   * @param {Headers} response.headers The response headers dictionary.
   */
  _logResponse(response) {
    const prefix = 'RESPONSE> ';
    const lines = [
      '<<---',
      `${prefix}${response.url}`,
      `${prefix}status: ${response.status}`,
    ];

    response.headers.forEach((value, header) => {
      lines.push(`${prefix}${header}: ${value}`);
    });

    this._appLogger.info(lines);
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `HTTP` as the `http` service. The provider also checks the `debug.logRequests` setting on
 * the app configuration in order to enable or not the logging of requests.
 *
 * @example
 * // Register it on the container
 * container.register(http);
 * // Getting access to the service instance
 * const http = container.get('http');
 * @type {Provider}
 */
const http = provider((app) => {
  app.set('http', () => {
    const logRequests = app.get('appConfiguration').get('debug.logRequests') === true;
    return new HTTP(logRequests, app.get('appLogger'));
  });
});

module.exports = {
  HTTP,
  http,
};
