const ObjectUtils = require('wootils/shared/objectUtils');
const APIClientBase = require('wootils/shared/apiClient');
const { providerCreator } = require('../../utils/wrappers');

/**
 * @typedef {import('./http').HTTP} HTTP
 * @typedef {import('../common/httpError').HTTPError} HTTPError
 */

/**
 * The options to customize how the service gets registered.
 *
 * @typedef {Object} APIClientProviderOptions
 * @property {string}           serviceName          The name of the service that will be
 *                                                   registered into the app. Default
 *                                                   `'apiClient'`.
 * @property {string}           configurationSetting The name of the configuration setting that
 *                                                   has the API information. Default `'api'`.
 * @property {typeof APIClient} clientClass          The class the service will instantiate. It
 *                                                   has to extend from {@link APIClient}, which
 *                                                   is the default value.
 * @parent module:services
 */

/**
 * The configuration for the API the client will make requests to.
 *
 * @typedef {Object} APIClientConfiguration
 * @property {string}             url       The API entry point.
 * @property {APIClientEndpoints} endpoints A dictionary of named endpoints relative to the API
 *                                          entry point.
 * @parent module:services
 */

/**
 * An API client for the app to use. What makes this service special is that its that it formats
 * the received errors using the `AppError` service class and as fetch function it uses the
 * `http` service, allowing the app to to internally handle all the requests and responses.
 *
 * @augments APIClientBase
 * @parent module:services
 */
class APIClient extends APIClientBase {
  /**
   * @param {APIClientConfiguration} apiConfig The configuration for the API the client will
   *                                           make requests to.
   * @param {HTTP}                   http      To get the `fetch` function for this service
   *                                           to use on all the requests.
   * @param {ClassHTTPError}         HTTPError To format the received errors.
   */
  constructor(apiConfig, http, HTTPError) {
    super(
      apiConfig.url,
      apiConfig.endpoints || apiConfig.gateway,
      http.fetch,
    );
    /**
     * The configuration for the API the client will make requests to.
     *
     * @type {APIClientConfiguration}
     * @access protected
     * @ignore
     */
    this._apiConfig = ObjectUtils.copy(apiConfig);
    /**
     * A local reference for the class the app uses to generate HTTP errors.
     *
     * @type {ClassHTTPError}
     * @access protected
     * @ignore
     */
    this._HTTPError = HTTPError;
  }
  /**
   * Formats a response error with the App error class.
   *
   * @param {Object} response A received response from a request.
   * @param {number} status   The HTTP status of the request.
   * @returns {HTTPError}
   */
  error(response, status) {
    return new this._HTTPError(this.getErrorMessageFromResponse(response), status);
  }
  /**
   * Helper method that tries to get an error message from a given response.
   *
   * @param {Object} response                      A received response from a request.
   * @param {string} [fallback='Unexpected error'] A fallback message in case the method doesn't
   *                                               found one on the response.
   * @returns {string}
   */
  getErrorMessageFromResponse(response, fallback = 'Unexpected error') {
    let message;
    if (response.error) {
      message = response.error;
    } else if (response.data && response.data && response.data.message) {
      ({ message } = response.data);
    } else if (response.data && response.data && response.data.error) {
      message = response.data.error;
    } else {
      message = fallback;
    }

    return message;
  }
  /**
   * The configuration for the API the client will make requests to.
   *
   * @type {APIClientConfiguration}
   * @todo Remove Object.freeze.
   */
  get apiConfig() {
    return Object.freeze(this._apiConfig);
  }
}
/**
 * An API Client service to make requests to an API using endpoints defined on the app
 * configuration.
 *
 * @type {ProviderCreator<APIClientProviderOptions>}
 * @parent module:services
 */
const apiClient = providerCreator((options = {}) => (app) => {
  const defaultName = 'apiClient';
  const {
    serviceName = defaultName,
    clientClass: ClientClass = APIClient,
  } = options;
  let { configurationSetting } = options;
  if (!configurationSetting) {
    configurationSetting = serviceName === defaultName ? 'api' : serviceName;
  }
  app.set(serviceName, () => new ClientClass(
    app.get('appConfiguration').get(configurationSetting),
    app.get('http'),
    app.get('HTTPError'),
  ));
});

module.exports.APIClient = APIClient;
module.exports.apiClient = apiClient;
