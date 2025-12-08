import { jimpex, healthController, fastHTMLMiddleware } from '../../src/index.js';
import { dateServiceProvider } from './service.js';
import { dateMiddleware } from './middleware.js';
import { dateController } from './controller.js';

const PORT = 2509;
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

app.listen(PORT);
