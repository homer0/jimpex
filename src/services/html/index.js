const { providers } = require('../../utils/wrappers');
const { htmlGenerator } = require('./htmlGenerator');

/**
 * @typedef {import('../../types').Provider} Provider
 */

/**
 * The providers collection for the HTML services.
 *
 * @type {Provider}
 * @property {Provider} htmlGenerator  The default provider for {@link HTMLGenerator}.
 * @parent module:services
 */
module.exports = providers({
  htmlGenerator,
});
