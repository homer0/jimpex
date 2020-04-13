const { errorHandler } = require('./errorHandler');
const { forceHTTPS } = require('./forceHTTPS');
const { hsts } = require('./hsts');

module.exports = {
  errorHandler,
  forceHTTPS,
  hsts,
};
