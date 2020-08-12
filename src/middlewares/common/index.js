const { errorHandler } = require('./errorHandler');
const { forceHTTPS } = require('./forceHTTPS');
const { hsts } = require('./hsts');

module.exports.errorHandler = errorHandler;
module.exports.forceHTTPS = forceHTTPS;
module.exports.hsts = hsts;
