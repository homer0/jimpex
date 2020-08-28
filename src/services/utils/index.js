const { ensureBearerToken } = require('./ensureBearerToken');
const { providers } = require('../../utils/wrappers');
/**
 * The providers collection for the utility services.
 *
 * @type {Provider}
 * @property {Provider} ensureBearerToken The provider for {@link EnsureBearerToken}.
 * @parent module:services
 */
const utilsServices = providers({
  ensureBearerToken,
});

module.exports = utilsServices;
