const { controller } = require('../../utils/wrappers');

/**
 * @typedef {import('../../types').AppConfiguration} AppConfiguration
 * @typedef {import('../../services/http/responsesBuilder').ResponsesBuilder}
 * ResponsesBuilder
 */

/**
 * Provides the handlers and middlwares to show and switch configurations.
 *
 * @parent module:controllers
 */
class ConfigurationController {
  /**
   * @param {AppConfiguration} appConfiguration  To read the app configuration.
   * @param {ResponsesBuilder} responsesBuilder  To generate the JSON responses.
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
   * Send a response with the current app configuration as a body.
   *
   * @param {ExpressResponse} res  The server response.
   */
  getConfigurationResponse(res) {
    const name = this._appConfiguration.get('name');
    const data = {
      name,
      ...this._appConfiguration.getConfig(),
    };

    this._responsesBuilder.json(res, data);
  }
  /**
   * Returns the middleware to show the current configuration.
   *
   * @returns {ExpressMiddleware}
   */
  showConfiguration() {
    return (req, res) => {
      this.getConfigurationResponse(res);
    };
  }
  /**
   * Returns the middleware to switch the current configuration.
   *
   * @returns {ExpressMiddleware}
   */
  switchConfiguration() {
    return (req, res, next) => {
      if (this._appConfiguration.canSwitch()) {
        try {
          this._appConfiguration.switch(req.params.name);
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
/**
 * This controller is kind of special as it will only mount the routes if the
 * `debug.configurationController` setting of the app configuration is `true`.
 * It provides routes for:
 * - Showing the current configuration.
 * - Switching the configuration, but only if the service allows it.
 *
 * @type {Controller}
 * @parent module:controllers
 * @todo Don't use an array to return the routes.
 */
const configurationController = controller((app) => {
  const routes = [];
  const appConfiguration = app.get('appConfiguration');
  if (appConfiguration.get('debug.configurationController') === true) {
    const router = app.get('router');
    const ctrl = new ConfigurationController(
      appConfiguration,
      app.get('responsesBuilder'),
    );
    routes.push(
      ...[
        router.get('/', ctrl.showConfiguration()),
        router.get('/switch/:name', ctrl.switchConfiguration()),
      ],
    );
  }

  return routes;
});

module.exports.ConfigurationController = ConfigurationController;
module.exports.configurationController = configurationController;
