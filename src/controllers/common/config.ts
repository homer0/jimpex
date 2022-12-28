import { controller } from '../../utils';
import type { ResponsesBuilder } from '../../services';
import type {
  SimpleConfig,
  Response,
  AsyncExpressMiddleware,
  ExpressMiddleware,
  Router,
} from '../../types';
/**
 * The options to contruct a {@link ConfigController}.
 *
 * @group Controllers/Config
 */
export type ConfigControllerOptions = {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    responsesBuilder: ResponsesBuilder;
    config: SimpleConfig;
  };
};
/**
 * The controller class that allows to show and switch the application configuration.
 *
 * @group Controller Classes
 * @group Controllers/Config
 * @prettierignore
 */
export class ConfigController {
  /**
   * The service in charge or building the responses.
   */
  protected readonly responsesBuilder: ResponsesBuilder;
  /**
   * The service in charge of the configuration.
   */
  protected readonly config: SimpleConfig;
  /**
   * @param options  The options to construct the controller.
   */
  constructor({ inject }: ConfigControllerOptions) {
    this.responsesBuilder = inject.responsesBuilder;
    this.config = inject.config;
  }
  /**
   * Creates the middleware the shows the current configuration.
   */
  showConfig(): ExpressMiddleware {
    return (_, res) => {
      this.respondWithConfig(res);
    };
  }
  /**
   * Creates the middleware the allows to switch the configuration.
   */
  switchConfig(): AsyncExpressMiddleware {
    return async (req, res, next) => {
      const { name } = req.params;
      if (!name || !this.config.canSwitchConfigs()) {
        next();
        return;
      }

      try {
        await this.config.switch(name);
        this.respondWithConfig(res);
      } catch (error) {
        next(error);
      }
    };
  }
  /**
   * Utility to respond with the current configuration.
   */
  protected respondWithConfig(res: Response): void {
    const name = this.config.get<string>('name');
    const data = {
      name,
      ...this.config.getConfig<Record<string, unknown>>(),
    };

    this.responsesBuilder.json({
      res,
      data,
    });
  }
}
/**
 * This controller is kind of special as it will only mount the routes if the
 * `debug.configController` setting of the app configuration is set to `true`.
 *
 * It provides routes for:
 * - `/`: Showing the current configuration.
 * - `/switch/:name`: Switching the configuration, but only if the service allows it.
 *
 * @group Controllers
 * @group Controllers/Config
 */
export const configController = controller((app) => {
  const config = app.get<SimpleConfig>('config');
  const router = app.get<Router>('router');
  if (config.get<boolean | undefined>('debug.configController') !== true) {
    return router;
  }

  const ctrl = new ConfigController({
    inject: {
      config,
      responsesBuilder: app.get('responsesBuilder'),
    },
  });

  return router.get('/', ctrl.showConfig()).get('/switch/:name', ctrl.switchConfig());
});
