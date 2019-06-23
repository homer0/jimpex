const APIClientBase = require('wootils/shared/apiClient');
const { provider } = require('../../utils/wrappers');
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
     */
    this.apiConfig = apiConfig;
    /**
     * A local reference for the class the app uses to generate HTTP errors.
     * @type {Class}
     */
    this.HTTPError = HTTPError;
  }
  /**
   * Formats a response error with the App error class.
   * @param {Object} response A received response from a request.
   * @param {number} status   The HTTP status of the request.
   * @return {HTTPError}
   */
  error(response, status) {
    return new this.HTTPError(response.data.message, status);
  }
}
/**
 * Generates a provider with customized options. This allows the app to have multiple clients for
 * different APIs.
 * @param {string} [name='apiClient']       The name of the service that will be registered into
 *                                          the app.
 * @param {string} [configurationKey='api'] The name of the app configuration setting that has the
 *                                          API information.
 * @param {Class}  [ClientClass=APIClient]  The Class the service will instantiate.
 * @return {Provider}
 */
const apiClientCustom = (
  name = 'apiClient',
  configurationKey = 'api',
  ClientClass = APIClient
) => provider((app) => {
  app.set(name, () => new ClientClass(
    app.get('appConfiguration').get(configurationKey),
    app.get('http'),
    app.get('HTTPError')
  ));
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `APIClient` as the `apiClient` service.
 * @example
 * // Register it on the container
 * container.register(apiClient);
 * // Getting access to the service instance
 * const apiClient = container.get('apiClient');
 * @type {Provider}
 */
const apiClient = apiClientCustom();

module.exports = {
  APIClient,
  apiClient,
  apiClientCustom,
};
