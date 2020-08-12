const { code: statuses } = require('statuses');
const { controller } = require('../../utils/wrappers');
/**
 * @typedef {import('../../services/http/responsesBuilder').ResponsesBuilder} ResponsesBuilder
 */

/**
 * Provides the handler to show a some minimal health information about the app:
 * - app version.
 * - configuration name.
 */
class HealthController {
  /**
   * @param {AppConfiguration} appConfiguration To read the app version and the configuration name.
   * @param {ResponsesBuilder} responsesBuilder To generate the JSON response.
   */
  constructor(appConfiguration, responsesBuilder) {
    /**
     * A local reference for the `appConfiguration` service.
     *
     * @type {AppConfiguration}
     * @access protected
     * @ignore
     */
    this._appConfiguration = appConfiguration;
    /**
     * A local reference for the `responsesBuilder` service.
     *
     * @type {ResponsesBuilder}
     * @access protected
     * @ignore
     */
    this._responsesBuilder = responsesBuilder;
  }
  /**
   * Returns the middleware that shows the health information.
   *
   * @returns {ExpressMiddleware}
   */
  health() {
    return (req, res) => {
      const {
        name: configuration,
        version,
      } = this._appConfiguration.get(['name', 'version']);
      this._responsesBuilder.json(res, {
        isHealthy: true,
        status: statuses.ok,
        configuration,
        version,
      });
    };
  }
}
/**
 * Mounts the health route.
 *
 * @type {Controller}
 */
const healthController = controller((app) => {
  const router = app.get('router');
  const ctrl = new HealthController(
    app.get('appConfiguration'),
    app.get('responsesBuilder'),
  );

  return [
    router.get('/', ctrl.health()),
  ];
});

module.exports.HealthController = HealthController;
module.exports.healthController = healthController;
