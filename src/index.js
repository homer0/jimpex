const Jimpex = require('./app');
const controllers = require('./controllers');
const middlewares = require('./middlewares');
const services = require('./services');
const { eventNames } = require('./constants');
const {
  provider,
  providerCreator,
  providers,
  controller,
  controllerCreator,
  middleware,
  middlewareCreator,
} = require('./utils/wrappers');
const utils = require('./utils/functions');

module.exports.controller = controller;
module.exports.controllerCreator = controllerCreator;
module.exports.controllers = controllers;
module.exports.middleware = middleware;
module.exports.middlewareCreator = middlewareCreator;
module.exports.middlewares = middlewares;
module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
module.exports.services = services;
module.exports.eventNames = eventNames;
module.exports.utils = utils;
module.exports.Jimpex = Jimpex;
