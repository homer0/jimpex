const { providers } = require('../../utils/wrappers');
const { frontendFs } = require('./frontendFs');

/**
 * @typedef {import('../../types').Provider} Provider
 */

/**
 * The providers collection for the frontend services.
 *
 * @type {Provider}
 * @property {Provider} frontendFs  The default provider for {@link FrontendFs}.
 * @parent module:services
 */
module.exports = providers({
  frontendFs,
});
