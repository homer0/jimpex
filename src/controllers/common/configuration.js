const { controller } = require('../../utils/wrappers');

class ConfigurationController {
  constructor(appConfiguration, responsesBuilder) {
    this.appConfiguration = appConfiguration;
    this.responsesBuilder = responsesBuilder;
  }

  getConfigurationResponse(res) {
    const name = this.appConfiguration.get('name');
    const data = Object.assign({ name }, this.appConfiguration.getConfig());
    return this.responsesBuilder.json(res, data);
  }

  showConfiguration() {
    return (req, res) => {
      this.getConfigurationResponse(res);
    };
  }

  switchConfiguration() {
    return (req, res, next) => {
      if (this.appConfiguration.canSwitch()) {
        try {
          this.appConfiguration.switch(req.params.name);
          this.getConfigurationResponse(res);
        } catch (error) {
          next(error);
        }
      } else {
        next();
      }
    };
  }
}

const configurationController = controller((app) => {
  const routes = [];
  const appConfiguration = app.get('appConfiguration');
  const debugging = appConfiguration.get('debug');
  if (debugging && debugging.configurationController === true) {
    const router = app.get('router');
    const ctrl = new ConfigurationController(
      appConfiguration,
      app.get('responsesBuilder')
    );
    routes.push(...[
      router.get('/', ctrl.showConfiguration()),
      router.get('/switch/:name', ctrl.switchConfiguration()),
    ]);
  }

  return routes;
});

module.exports = {
  ConfigurationController,
  configurationController,
};
