import { controller, type Statuses } from '../../utils';
import type { ResponsesBuilder } from '../../services';
import type {
  JimpexHealthStatus,
  SimpleConfig,
  AsyncExpressMiddleware,
  Router,
} from '../../types';
/**
 * A function that will return the health status of the application.
 */
export type GetHealthStatus = () => Promise<JimpexHealthStatus>;
/**
 * The options to contruct a {@link HealthController}.
 */
export type HealthControllerOptions = {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    getHealthStatus: GetHealthStatus;
    responsesBuilder: ResponsesBuilder;
    config: SimpleConfig;
    statuses: Statuses;
  };
};
/**
 * The controller class that shows the application health status.
 */
export class HealthController {
  /**
   * The function that returns the health status of the application.
   */
  protected readonly getHealthStatus: GetHealthStatus;
  /**
   * The service in charge or building the responses.
   */
  protected readonly responsesBuilder: ResponsesBuilder;
  /**
   * The service in charge of the configuration.
   */
  protected readonly config: SimpleConfig;
  /**
   * The uility service to get HTTP status codes.
   */
  protected readonly statuses: Statuses;
  /**
   * @param options  The options to construct the controller.
   */
  constructor({ inject }: HealthControllerOptions) {
    this.getHealthStatus = inject.getHealthStatus;
    this.responsesBuilder = inject.responsesBuilder;
    this.config = inject.config;
    this.statuses = inject.statuses;
  }
  /**
   * Creates the middleware the shows the application health status.
   */
  showHealth(): AsyncExpressMiddleware {
    return async (_, res) => {
      const healthStatus = await this.getHealthStatus();
      let isHealthy: boolean;
      let extras: Record<string, unknown>;
      if (typeof healthStatus === 'boolean') {
        isHealthy = healthStatus;
        extras = {};
      } else {
        if (typeof healthStatus.isHealthy === 'boolean') {
          isHealthy = healthStatus.isHealthy;
        } else if (healthStatus.services) {
          isHealthy = Object.values(healthStatus.services).every(
            (value) => value === true,
          );
        } else {
          isHealthy = true;
        }

        extras = {
          ...healthStatus.services,
        };
      }

      const { name: config, version } = this.config.get<{
        name: string;
        version: string;
      }>(['name', 'version']);

      const status = isHealthy
        ? this.statuses('ok')
        : this.statuses('service unavailable');

      this.responsesBuilder.json({
        res,
        status,
        data: {
          isHealthy,
          status,
          config,
          version,
          ...extras,
        },
      });
    };
  }
}
/**
 * The controller that once mounted, it will add an endpoint to show the application
 * health status.
 */
export const healthController = controller((app) => {
  const router = app.get<Router>('router');
  const ctrl = new HealthController({
    inject: {
      getHealthStatus: app.isHealthy.bind(app),
      responsesBuilder: app.get('responsesBuilder'),
      config: app.get('config'),
      statuses: app.get('statuses'),
    },
  });

  return router.get('/', ctrl.showHealth());
});
