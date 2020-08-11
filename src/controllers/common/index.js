const { configurationController } = require('./configuration');
const { healthController } = require('./health');
const { staticsController } = require('./statics');

module.exports.configurationController = configurationController;
module.exports.healthController = healthController;
module.exports.staticsController = staticsController;
