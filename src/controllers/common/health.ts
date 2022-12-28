import { controller, type Statuses } from '../../utils';
import type { ResponsesBuilder } from '../../services';
import type {
  JimpexHealthStatus,
  SimpleConfig,
  AsyncExpressMiddleware,
  Router,
} from '../../types';

export type GetHealthStatus = () => Promise<JimpexHealthStatus>;

export type HealthControllerOptions = {
  inject: {
    getHealthStatus: GetHealthStatus;
    responsesBuilder: ResponsesBuilder;
    config: SimpleConfig;
    statuses: Statuses;
  };
};

export class HealthController {
  protected readonly getHealthStatus: GetHealthStatus;
  protected readonly responsesBuilder: ResponsesBuilder;
  protected readonly config: SimpleConfig;
  protected readonly statuses: Statuses;
  constructor({ inject }: HealthControllerOptions) {
    this.getHealthStatus = inject.getHealthStatus;
    this.responsesBuilder = inject.responsesBuilder;
    this.config = inject.config;
    this.statuses = inject.statuses;
  }

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
