const { http } = require('./http');
const { responsesBuilder } = require('./responsesBuilder');
const { providers } = require('../../utils/wrappers');
/**
 * The providers collection for the HTTP services.
 * @type {Provider}
 * @property {Provider} http             The provider for {@link HTTP}.
 * @property {Provider} responsesBuilder The provider for {@link ResponsesBuilder}.
 */
const httpServices = providers({
  http,
  responsesBuilder,
});

module.exports = httpServices;
