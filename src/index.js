const Jimpex = require('./app');
const controllers = require('./controllers');
const middlewares = require('./middlewares');
const services = require('./services');
const {
  provider,
  providerCreator,
  providers,
  controller,
  controllerCreator,
  middleware,
  middlewareCreator,
} = require('./utils/wrappers');

module.exports = {
  controller,
  controllerCreator,
  controllers,
  middleware,
  middlewareCreator,
  middlewares,
  provider,
  providerCreator,
  providers,
  services,
  Jimpex,
};
