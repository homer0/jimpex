const Jimpex = require('./app');
const controllers = require('./controllers');
const middlewares = require('./middlewares');
const services = require('./services');
const {
  provider,
  controller,
  middleware,
} = require('./utils/wrappers');

module.exports = {
  Jimpex,
  provider,
  controllers,
  middlewares,
  services,
  controller,
  middleware,
};
