import { jimpex, healthController, fastHTMLMiddleware } from '../../src';
import { dateServiceProvider } from './service';
import { dateMiddleware } from './middleware';
import { dateController } from './controller';

const app = jimpex();
app.register(dateServiceProvider);

app.use(dateMiddleware);
app.mount('/', healthController);
app.use(
  fastHTMLMiddleware({
    file: '404.html',
  }),
);
app.mount('/date', dateController);

export { app };
