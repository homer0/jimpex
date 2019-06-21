const { apiClient } = require('./client');
const { ensureBearerAuthentication } = require('./ensureBearerAuthentication');
const { provider } = require('../../utils/wrappers');
/**
 * A single service provider that once registered on the app container will take care of
 * registering the providers for the `apiClient`, 'ensureBearerAuthentication' and
 * `versionValidator` services.
 * @type {Provider}
 */
const all = provider((app) => {
  app.register(apiClient);
  app.register(ensureBearerAuthentication);
});

module.exports = {
  apiClient,
  ensureBearerAuthentication,
  all,
};
