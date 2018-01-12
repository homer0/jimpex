const { http } = require('./http');
const { responsesBuilder } = require('./responsesBuilder');
const { provider } = require('../../utils/wrappers');

module.exports = {
  http,
  responsesBuilder,
  all: provider((app) => {
    app.register(http);
    app.register(responsesBuilder);
  }),
};
