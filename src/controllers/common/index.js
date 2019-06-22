const { configurationController } = require('./configuration');
const { healthController } = require('./health');
const { staticsController } = require('./statics');

module.exports = {
  configurationController,
  healthController,
  staticsController,
};
