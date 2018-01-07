const { provider } = require('jimple');

const controller = (connect) => ({ connect });
const middleware = (connect) => ({ connect });

module.exports = {
  provider,
  controller,
  middleware,
};
