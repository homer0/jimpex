const { http } = require('./http');
const { responsesBuilder } = require('./responsesBuilder');
const { provider } = require('../../utils/wrappers');
/**
 * A single service provider that once registered on the app container will take care of
 * registering the providers for the `http` and 'responsesBuilder' services.
 * @type {Provider}
 */
const all = provider((app) => {
  app.register(http);
  app.register(responsesBuilder);
});

module.exports = {
  http,
  responsesBuilder,
  all,
};
