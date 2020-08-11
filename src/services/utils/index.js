const { ensureBearerToken } = require('./ensureBearerToken');
const { providers } = require('../../utils/wrappers');
/**
 * The providers collection for the utils services.
 *
 * @type {Provider}
 * @property {Provider} ensureBearerToken The provider for {@link EnsureBearerToken}.
 */
const utilsServices = providers({
  ensureBearerToken,
});

module.exports = utilsServices;
