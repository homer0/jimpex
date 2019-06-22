const { configurationController } = require('./configuration');
const { healthController } = require('./health');
const { rootStaticsController } = require('./rootStatics');
const { staticsController } = require('./statics');

module.exports = {
  configurationController,
  healthController,
  rootStaticsController,
  staticsController,
};
