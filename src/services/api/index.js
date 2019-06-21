const { apiClient } = require('./client');
const { providers } = require('../../utils/wrappers');

/**
 * The providers collection for the API services.
 * @type {Provider}
 * @property {Provider} apiClient
 * The provider for {@link APIClient}.
 * @property {Provider} ensureBearerAuthentication
 * The provider for {@link EnsureBearerAuthentication}.
 */
const apiServices = providers({
  apiClient,
});

module.exports = apiServices;
