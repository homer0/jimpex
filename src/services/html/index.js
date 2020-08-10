const { providers } = require('../../utils/wrappers');
const { htmlGenerator } = require('./htmlGenerator');

module.exports = providers({
  htmlGenerator,
});
