const statuses = require('statuses');
const { controller } = require('../../utils/wrappers');

class HealthController {
  constructor(appConfiguration, responsesBuilder) {
    this.appConfiguration = appConfiguration;
    this.responsesBuilder = responsesBuilder;
  }

  health() {
    return (req, res) => {
      const {
        name: configuration,
        version,
      } = this.appConfiguration.get(['name', 'version']);
      this.responsesBuilder.json(res, {
        isHealthy: true,
        status: statuses.ok,
        configuration,
        version,
      });
    };
  }
}

const healthController = controller((app) => {
  const router = app.get('router');
  const ctrl = new HealthController(
    app.get('appConfiguration'),
    app.get('responsesBuilder')
  );

  return [
    router.get('/', ctrl.health()),
  ];
});

module.exports = {
  HealthController,
  healthController,
};
