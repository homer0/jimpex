const { appError } = require('./appError');
const { httpError } = require('./httpError');
const { sendFileProvider } = require('./sendFile');
const { provider } = require('../../utils/wrappers');
/**
 * A single service provider that once registered on the app container will take care of
 * registering the providers for the `appError` and `sendFileProvider` services.
 * @type {Provider}
 */
const all = provider((app) => {
  app.register(appError);
  app.register(httpError);
  app.register(sendFileProvider);
});

module.exports = {
  appError,
  httpError,
  sendFile: sendFileProvider,
  all,
};
