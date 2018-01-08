const { configurationController } = require('./configuration');
const { healthController } = require('./heath');
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
