const APIClientBase = require('wootils/shared/apiClient');
const { provider } = require('../../utils/wrappers');

class APIClient extends APIClientBase {
  constructor(apiConfig, http, AppError) {
    super(apiConfig.url, apiConfig.endpoints, http.fetch);
    this.apiConfig = apiConfig;
    this.AppError = AppError;
  }

  error(response, status) {
    return new this.AppError(response.data.message, { status });
  }
}

const apiClientCustom = (
  name = 'apiClient',
  configurationKey = 'api',
  ClientClass = APIClient
) => provider((app) => {
  app.set(name, () => new ClientClass(
    app.get('appConfiguration').get(configurationKey),
    app.get('http'),
    app.get('appError')
  ));
});

const apiClient = apiClientCustom();

module.exports = {
  APIClient,
  apiClient,
  apiClientCustom,
};
