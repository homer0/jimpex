# 💪 Jimpex with TypeScript

Jimpex was completely rewritten in TypeScript for v8, so now it's easier a lot easier to type your Jimpex projects.

Unfortunately, since Express doesn't ship their own types, you'll need to install the `@types/express` package.

```bash
npm install --save-dev @types/express
```

## Middlewares

When writing middlewares, instead of reaching for the `Request` and `Response` types, you can use `ExpressMiddleware` or `AsyncExpressMiddleware`:

```ts
import { middleware, type ExpressMiddleware, type Logger } from 'jimpex';

export const helloMiddleware = middleware((app) => {
  const logger = app.get<Logger>('logger');
  const mdl: ExpressMiddleware = (req, res, next) => {
    const hostname = req.get('host')!;
    logger.info(`Request from ${hostname}`);
    next();
  };

  // It's defined and then returned so it can be typed.
  return mdl;
});
```

And in case you want to implement an error handler middleware, you can also use `ExpressErrorHandler`:

```ts
import { middleware, type ExpressErrorHandler, type Logger } from 'jimpex';

export const helloMiddleware = middleware((app) => {
  const logger = app.get<Logger>('logger');
  const mdl: ExpressErrorHandler = (err, req, res, next) => {
    logger.info(err);
    next(err);
  };

  // It's defined and then returned so it can be typed.
  return mdl;
});
```
