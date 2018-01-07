const { apiClient, apiClientCustom } = require('./client');
const { ensureBearerAuthentication } = require('./ensureBearerAuthentication');
const { versionValidator } = require('./versionValidator');
const { provider } = require('../../utils/wrappers');

module.exports = {
  apiClient,
  apiClientCustom,
  ensureBearerAuthentication,
  versionValidator,
  all: provider((app) => {
    app.register(apiClient);
    app.register(ensureBearerAuthentication);
    app.register(versionValidator);
  }),
};
