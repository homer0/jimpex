const { appError } = require('./appError');
const { httpError } = require('./httpError');
const { sendFileProvider } = require('./sendFile');
const { providers } = require('../../utils/wrappers');

/**
 * @typedef {import('../../types').Provider} Provider
 */

/**
 * The providers collection for the common services.
 *
 * @type {Provider}
 * @property {Provider} appError   The provider for {@link AppError}.
 * @property {Provider} httpError  The provider for {@link HTTPError}.
 * @property {Provider} sendFile   The provider for {@link SendFile}.
 * @parent module:services
 */
const commonServices = providers({
  appError,
  httpError,
  sendFile: sendFileProvider,
});

module.exports = commonServices;
