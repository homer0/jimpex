const { apiClient } = require('./apiClient');
const { http } = require('./http');
const { responsesBuilder } = require('./responsesBuilder');
const { providers } = require('../../utils/wrappers');
/**
 * The providers collection for the HTTP services.
 *
 * @type {Provider}
 * @property {Provider} apiClient         The provider for {@link APIClient}.
 * @property {Provider} http              The provider for {@link HTTP}.
 * @property {Provider} responsesBuilder  The provider for {@link ResponsesBuilder}.
 * @parent module:services
 */
const httpServices = providers({
  apiClient,
  http,
  responsesBuilder,
});

module.exports = httpServices;
