const { providers } = require('../../utils/wrappers');
const { frontendFs } = require('./frontendFs');

module.exports = providers({
  frontendFs,
});
