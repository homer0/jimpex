const { appError } = require('./error');
const { sendFileProvider } = require('./sendFile');
const { provider } = require('../../utils/wrappers');
/**
 * A single service provider that once registered on the app container will take care of
 * registering the providers for the `appError` and `sendFileProvider` services.
 * @type {Provider}
 */
const all = provider((app) => {
  app.register(appError);
  app.register(sendFileProvider);
});

module.exports = {
  appError,
  sendFile: sendFileProvider,
  all,
};
