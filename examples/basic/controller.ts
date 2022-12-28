import {
  controller,
  type ExpressMiddleware,
  type ResponsesBuilder,
  type Router,
} from '../../src';
import type { DateService } from './service';

class DateController {
  constructor(
    private readonly dateService: DateService,
    private readonly responsesBuilder: ResponsesBuilder,
  ) {}

  showNow(): ExpressMiddleware {
    return (_, res) => {
      this.responsesBuilder.json({
        res,
        data: {
          now: this.dateService.now(),
        },
      });
    };
  }

  showInfo(): ExpressMiddleware {
    return (_, res) => {
      const now = this.dateService.now();
      const [date, time] = now.toISOString().split('T');
      this.responsesBuilder.json({
        res,
        data: {
          date,
          time,
        },
      });
    };
  }
}

export const dateController = controller((app) => {
  const router = app.get<Router>('router');
  const ctrl = new DateController(app.get('date'), app.get('responsesBuilder'));
  return router.get('/', ctrl.showNow()).get('/info', ctrl.showInfo());
});
