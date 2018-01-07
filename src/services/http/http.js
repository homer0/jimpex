const fetch = require('node-fetch');
const urijs = require('urijs');
const { provider } = require('../../utils/wrappers');

class HTTP {
  constructor(logRequests, appLogger) {
    this.logRequests = logRequests;
    this.appLogger = appLogger;
    /**
     * So it can be sent to other services as a regular fetch function
     * @ignore
     */
    this.fetch = this.fetch.bind(this);
  }

  getIPFromRequest(req) {
    return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  }

  getCustomHeadersFromRequest(req) {
    const headers = {};
    Object.keys(req.headers).forEach((headerName) => {
      if (headerName.startsWith('x-') && !headerName.startsWith('x-forwarded-for')) {
        headers[headerName] = req.headers[headerName];
      }
    });

    return headers;
  }

  fetch(url, options = {}) {
    let fetchURL = url;

    if (options.qs) {
      fetchURL = urijs(url).addSearch(options.qs).toString();
    }

    const fetchOptions = {
      method: (options.method || 'get').toUpperCase(),
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    let defaultHeaders = {};
    if (options.req) {
      defaultHeaders = Object.assign(
        {
          'x-forwarded-for': this.getIPFromRequest(options.req),
        },
        this.getCustomHeadersFromRequest(options.req)
      );
    }

    fetchOptions.headers = Object.assign(
      {},
      defaultHeaders,
      (options.headers || {})
    );

    if (this.logRequests) {
      this._logRequest(fetchURL, fetchOptions);
    }

    let result = fetch(fetchURL, fetchOptions);
    if (this.logRequests) {
      result = result.then((response) => {
        this._logResponse(response);
        return response;
      });
    }

    return result;
  }

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

    this.appLogger.info(lines);
  }

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

    this.appLogger.info(lines);
  }
}

const http = provider((app) => {
  app.set('http', () => {
    const debugging = app.get('appConfiguration').get('debug');
    const logRequests = debugging && debugging.logRequests === true;
    return new HTTP(logRequests, app.get('appLogger'));
  });
});

module.exports = {
  HTTP,
  http,
};
