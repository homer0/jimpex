# 💪 Jimpex with TypeScript

Jimpex was completely rewritten in TypeScript for v8, so now it's easier a lot easier to type your Jimpex projects.

- [Express types](#express-types)
- [Middlewares](#middlewares)
- [Events](#events)

## Express types

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
  const mdw: ExpressMiddleware = (req, res, next) => {
    const hostname = req.get('host')!;
    logger.info(`Request from ${hostname}`);
    next();
  };

  // It's defined and then returned so it can be typed.
  return mdw;
});
```

And in case you want to implement an error handler middleware, you can also use `ExpressErrorHandler`:

```ts
import { middleware, type ExpressErrorHandler, type Logger } from 'jimpex';

export const helloMiddleware = middleware((app) => {
  const logger = app.get<Logger>('logger');
  const mdw: ExpressErrorHandler = (err, req, res, next) => {
    logger.info(err);
    next(err);
  };

  // It's defined and then returned so it can be typed.
  return mdw;
});
```

## Events

All events on Jimpex are typed, so when calling `on`/`once`, you'll get autocompletion for the event names, and the payload the can receive

```ts
import { provider, type Events, type Logger } from 'jimpex';

export const helloProvider = provider((app) => {
  const events = app.get<Events>('events');
  const logger = app.get<Logger>('logger');
  events.on('routeAdded', ({ route }) => {
    logger.info(`Route added: ${route}`);
  });
});
```

Thanks to [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html), you can also add your own events to the `Events` type:

```ts
import { provider, type Events, type Logger } from 'jimpex';

declare module 'jimpex' {
  interface JimpexEvents {
    newRoute: string;
  }
}

export const helloProvider = provider((app) => {
  const events = app.get<Events>('events');
  const logger = app.get<Logger>('logger');
  events.on('routeAdded', ({ route }) => {
    events.emit('newRoute', route);
  });

  events.on('newRoute', (route) => {
    logger.info(`New route added: ${route}`);
  });
});
```
