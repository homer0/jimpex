const Jimpex = require('./app');
const controllers = require('./controllers');
const middlewares = require('./middlewares');
const services = require('./services');
const { eventNames } = require('./constants');
const {
  provider,
  providerCreator,
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
  services,
  eventNames,
  Jimpex,
};
