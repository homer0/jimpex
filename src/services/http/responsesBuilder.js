const { code: statuses } = require('statuses');
const { provider } = require('../../utils/wrappers');
/**
 * It allows customization of a post message HTML template.
 *
 * @typedef {Object} ResponsesBuilderPostMessageOptions
 * @property {?string}  [target='window.opener'] The target that will emit the `postMessage`.
 * @property {?boolean} [close=true]             Whether or not to do a `window.close` after
 *                                               sending the message.
 * @property {?number}  [closeDelay=700]         How many ms should it wait before closing the
 *                                               window, if `options.close` is `true`.
 */

/**
 * A utility service to build server responses.
 */
class ResponsesBuilder {
  /**
   * @param {AppConfiguration} appConfiguration To get the app version.
   */
  constructor(appConfiguration) {
    /**
     * A local reference for the `appConfiguration` service.
     *
     * @type {AppConfiguration}
     * @access protected
     * @ignore
     */
    this._appConfiguration = appConfiguration;
  }
  /**
   * Generates and send an HTML response that emits a post message.
   * The post message will be prefixed with the value of the configuration setting
   * `postMessagesPrefix`.
   *
   * @param {ExpressResponse}                    res          The Express response object
   *                                                          necessary to write the HTML.
   * @param {string}                             title        The title for the HTML.
   * @param {string}                             message      The contents of the post message.
   * @param {number}                             [status=200] The HTTP status.
   * @param {ResponsesBuilderPostMessageOptions} [options={}] Options to customize the HTML.
   */
  htmlPostMessage(
    res,
    title,
    message,
    status = statuses.ok,
    options = {},
  ) {
    const prefix = this._appConfiguration.get('postMessagesPrefix') || '';
    const target = options.target || 'window.opener';
    const close = typeof options.close !== 'undefined' ? options.close : true;
    const defaultCloseDelay = 700;
    const closeDelay = options.closeDelay || defaultCloseDelay;
    const closeCode = close ?
      `setTimeout(function() { window.close(); }, ${closeDelay});` :
      '';
    const html = this._htmlTemplate(title, `
      (function() {
        if (${target}) {
          ${target}.postMessage('${prefix}${message}', '*');
          ${closeCode}
        }
      })();
      `);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
    res.status(this._normalizeStatus(status));
    res.write(html);
    res.end();
  }
  /**
   * Generates and sends a JSON response.
   *
   * @example
   * <caption>The generated looks like this.</caption>
   * {
   *   metadata: {
   *     version: '[app-version]',
   *     status: [http-status],
   *   },
   *   data: [...],
   * }
   *
   * @param {ExpressResponse} res           The Express response object necessary to write the JSON.
   * @param {Object}          data          The information for the `data` key.
   * @param {number}          [status=200]  The HTTP status.
   * @param {Object}          [metadata={}] Extra information to include on the `metadata` key.
   */
  json(res, data, status = statuses.ok, metadata = {}) {
    const useStatus = this._normalizeStatus(status);
    res
    .status(useStatus)
    .json({
      metadata: {
        version: this._appConfiguration.get('version'),
        status: useStatus,
        ...metadata,
      },
      data,
    })
    .end();
  }
  /**
   * Generates a basic HTML template for other services to use.
   *
   * @param {string} title The HTML `<title />` attribute.
   * @param {string} code  Javascript code to be wrapped on a `<script />` tag.
   * @returns {string}
   * @ignore
   * @access protected
   */
  _htmlTemplate(title, code) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
        </head>
        <body>
          <script type="text/javascript">
          ${code}
        </script>
      </body>
    </html>
    `;
  }
  /**
   * Utility method used to make sure a recevied status is a valid status code. If the status
   * is a string, the method will try to find the code from the `statuses` package.
   *
   * @param {string|number} status The status to normalize.
   * @returns {string|number} If `status` is a string, but there's no valid code, it will return it
   *                         as it was received.
   * @access protected
   * @ignore
   * @todo On the next breaking version, if there's no valid code, it will be transformed to `200`.
   */
  _normalizeStatus(status) {
    let result;
    if (typeof status === 'string') {
      result = statuses[status] || status;
    } else {
      result = status;
    }

    return result;
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `ResponsesBuilder` as the `responsesBuilder` service.
 *
 * @example
 * // Register it on the container
 * container.register(responsesBuilder);
 * // Getting access to the service instance
 * const responsesBuilder = container.get('responsesBuilder');
 * @type {Provider}
 */
const responsesBuilder = provider((app) => {
  app.set('responsesBuilder', () => new ResponsesBuilder(
    app.get('appConfiguration'),
  ));
});

module.exports.ResponsesBuilder = ResponsesBuilder;
module.exports.responsesBuilder = responsesBuilder;
