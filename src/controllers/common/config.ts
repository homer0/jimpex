import { controller } from '../../utils';
import type { ResponsesBuilder } from '../../services';
import type {
  SimpleConfig,
  Response,
  AsyncExpressMiddleware,
  ExpressMiddleware,
  Router,
} from '../../types';

export type ConfigControllerOptions = {
  inject: {
    responsesBuilder: ResponsesBuilder;
    config: SimpleConfig;
  };
};

export class ConfigController {
  protected readonly responsesBuilder: ResponsesBuilder;
  protected readonly config: SimpleConfig;
  constructor({ inject }: ConfigControllerOptions) {
    this.responsesBuilder = inject.responsesBuilder;
    this.config = inject.config;
  }

  showConfig(): ExpressMiddleware {
    return (_, res) => {
      this.respondWithConfig(res);
    };
  }

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
