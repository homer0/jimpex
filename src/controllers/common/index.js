const { configurationController } = require('./configuration');
const { healthController } = require('./health');
const {
  rootStaticsController,
  rootStaticsControllerCustom,
} = require('./rootStatics');

module.exports = {
  configurationController,
  healthController,
  rootStaticsController,
  rootStaticsControllerCustom,
};
