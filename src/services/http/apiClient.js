const ObjectUtils = require('wootils/shared/objectUtils');
const APIClientBase = require('wootils/shared/apiClient');
const { providerCreator } = require('../../utils/wrappers');
/**
 * An API client for the app to use. What makes this service special is that its that it formats
 * the received errors using the `AppError` service class and as fetch function it uses the
 * `http` service, allowing the app to to internally handle all the requests and responses.
 * @extends {APIClientBase}
 */
class APIClient extends APIClientBase {
  /**
   * Class constructor.
   * @param {Object}             apiConfig           The configuration for the API the client will
   *                                                 make requests to.
   * @param {string}             apiConfig.url       The API entry point.
   * @param {APIClientEndpoints} apiConfig.endpoints A dictionary of named endpoints relative to
   *                                                 the API entry point.
   * @param {HTTP}               http                To get the `fetch` function for this service
   *                                                 to use on all the requests.
   * @param {Class}              HTTPError           To format the received errors.
   */
  constructor(apiConfig, http, HTTPError) {
    super(apiConfig.url, apiConfig.endpoints, http.fetch);
    /**
     * The configuration for the API the client will make requests to.
     * @type {Object}
     * @property {string} url       The API entry point.
     * @property {Object} endpoints A dictionary of named endpoints relative to the API
     *                              entry point.
     * @access protected
     * @ignore
     */
    this._apiConfig = ObjectUtils.copy(apiConfig);
    /**
     * A local reference for the class the app uses to generate HTTP errors.
     * @type {Class}
     * @access protected
     * @ignore
     */
    this._HTTPError = HTTPError;
  }
  /**
   * Formats a response error with the App error class.
   * @param {Object} response A received response from a request.
   * @param {number} status   The HTTP status of the request.
   * @return {HTTPError}
   */
  error(response, status) {
    return new this._HTTPError(this.getErrorMessageFromResponse(response), status);
  }
  /**
   * Helper method that tries to get an error message from a given response.
   * @param {Object} response                      A received response from a request.
   * @param {string} [fallback='Unexpected error'] A fallback message in case the method doesn't
   *                                               found one on the response.
   * @return {string}
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
   * @type {Object}
   * @property {string} url       The API entry point.
   * @property {Object} endpoints A dictionary of named endpoints relative to the API
   *                              entry point.
   */
  get apiConfig() {
    return Object.freeze(this._apiConfig);
  }
}
/**
 * An API Client service to make requests to an API using endpoints defined on the app
 * configuration.
 * @type {ProviderCreator}
 * @param {string} [name='apiClient']       The name of the service that will be registered into
 *                                          the app.
 * @param {string} [configurationKey='api'] The name of the app configuration setting that has the
 *                                          API information.
 * @param {Class}  [ClientClass=APIClient]  The Class the service will instantiate.
 */
const apiClient = providerCreator((
  name = 'apiClient',
  configurationKey = 'api',
  ClientClass = APIClient
) => (app) => {
  app.set(name, () => new ClientClass(
    app.get('appConfiguration').get(configurationKey),
    app.get('http'),
    app.get('HTTPError')
  ));
});

module.exports = {
  APIClient,
  apiClient,
};
