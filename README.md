# Jimpex

[![GitHub Workflow Status (main)](https://img.shields.io/github/workflow/status/homer0/jimpex/Test/main?style=flat-square)](https://github.com/homer0/jimpex/actions?query=workflow%3ATest)
[![Coveralls GitHub](https://img.shields.io/coveralls/github/homer0/jimpex.svg?style=flat-square)](https://coveralls.io/github/homer0/jimpex?branch=main)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/jimpex)

Express as dependency injection container.

Jimpex is an implementation of [Express](https://expressjs.com), one of the most popular web frameworks for Node, using [Jimple](https://github.com/fjorgemota/jimple), a Javascript port of [Pimple](https://github.com/silexphp/Pimple) dependency injection container.

- [🍿 Usage](#🍿-usage)
  - [🎨 Creating your app](#🎨-creating-your-app)
  - [🤖 Boot](#🤖-boot)
  - [⚙️ Options and configuration](#⚙️-options-and-configuration)
    - [Options](#options)
    - [Configuration](#configuration)
  - [🚀 Starting your app](#🚀-starting-the-app)
  - [✅ HTTPS](#✅-https)
    - [HTTP2](#http2)
  - [🛠 Services](#🛠-services)
    - [Configurable services](#configurable-services)
  - [🚦 Controllers](#🚦-controller)
    - [Configurable controllers](#configurable-controllers)
    - [Controllers with services](#controllers-with-services)
  - [⚡️ Middlewares](#⚡️-middlewares)
    - [Configurable middlewares](#configurable-middlewares)
    - [Middlewares with services](#middlewares-with-services)
- [🤞 Examples](#🤞-examples)
- [🤘 Development](#development)
  - [NPM scripts](#npm-scripts)
  - [Repository hooks](#repository-hooks)
  - [Commits conventions](#commits-conventions)
  - [Releases](#releases)
  - [Testing](#testing)
  - [Code linting and formatting](#code-linting-and-formatting)
  - [Documentation](#documentation)
- [👀 Motivation](#👀-motivation)

## 🍿 Usage

### 🎨 Creating your app

```ts
import { jimpex } from 'jimpex';

const app = jimpex();
app.set('something', () => new Something());
app.mount('/hello', (req, res) => res.send('Hello World!'));
app.listen(2509, () => {
  console.log('The app is running!');
});
```

That's all: you create the app, register/set your dependencies, and mount your routes.

Alternatively, you could import the class, subclass it, and make use of the "life cycle" methods to configure it:

```ts
import { Jimpex } from 'jimpex';

class MyApp extends Jimpex {
  boot() {
    this.set('something', () => new Something());
    app.mount('/hello', (req, res) => res.send('Hello World!'));
  }
}

const app = new MyApp();
app.listen(2509, () => {
  console.log('The app is running!');
});
```

### 🤖 Boot

The `boot` method gets called right from the constructor, when the `boot` option is set to `true` (its default value), and the idea is for you to use it to add all your customizations (as seen in the example above).

Like `boot`, there's another "helper method" that you can use to register your dependencies: `_init`; the difference is that `_init` gets called from the constructor before the `boot` options gets validated. This allows you to create scenarios in which you could register some resources on `_init`, disable the call to `boot`, overwrite what you set on `_init`, and manually call `boot`:

```ts
class MyApp extends Jimpex {
  _init() {
    this.set('message', 'Hello Charo!');
  }

  boot() {
    app.mount('/hello', (req, res) => res.send(this.get('message')));
  }
}

const app = new MyApp({ boot: false });
app.set('message', 'Hello Pili!');
app.boot();
```

Now, this may look like an unnecessary feature, but if you consider the possiblity of different entry points based on environment, maybe to enable debugging tools on dev, this becomes really useful.

### ⚙️ Options and configuration

On Jimpex, you have two sets of "settings": the options, which are in the code when you create the application; and the configuration, which may be related to the environment in which the application is running.

#### Options

You can read all about the different options in [its own documentation](https://github.com/homer0/jimpex/blob/main/documents/options.md), but they're more related to the application capabilities. For example:

- Whether or not to call `boot`.
- Whether or not Express should remove the `x-powered-by` header.
- Which env var to check for the environment configuration (you'll see more about this in a sec).

And depending on how you defined your application, you have two ways to customize the options.

First, if you used the function, you can just send them as a parameter:

```ts
import { jimpex } from 'jimpex';

const app = jimpex({
  boot: false,
  express: {
    disableXPoweredBy: true,
  },
  config: {
    environmentVariable: 'NODE_ENV',
  },
});
```

And yes, you could also use this approach with the class, as both the function and the class constructor share the same parameters, but if you want to already define your options inside your subclass, there's a _protected_ helper for it: `_initOptions`.

```ts
import { Jimpex } from 'jimpex';

class MyApp extends Jimpex {
  _initOptions() {
    return {
      boot: false,
      express: {
        disableXPoweredBy: true,
      },
      config: {
        environmentVariable: 'NODE_ENV',
      },
    };
  }
}
```

The advantage of `_initOptions` is not only that you don't need to overwrite the constructor, but that you can still receive the options from the constructor, and Jimpex will automatically deep merge the ones on `_initOptions` on top of them.

#### Configuration

These are the settings that are more related to the runtime, and that can change depending on the environment. The most basic example of a "configuration setting" would be the port in which the application runs: you could run it on local env in 3000, and on production in 80 (or 443).

While the configuration is more easily managed with external (config) files, you could also send it in the options:

```ts
import { jimpex } from 'jimpex';

const app = jimpex({
  config: {
    default: {
      port: 3000,
    },
  },
});

// or

const app2 = jimpex(
  { someOption: false },
  {
    port: 3000,
  },
);
```

You can use the option `config.default`, or just the second parameter of both the function and the class.

> ⚠️ If you don't configure the `port` and call `start()`, the application will throw an error.

That's the basic usage, but as mentioned before, the configuration is more easily managed with external files: when loading the configuration, which happens when the server starts, it will try to look for a file `config/app.config.js`, and if it exists, it will set whatever it (default) exports as the configuration.

So, we could write the configuration from the example above and use it like this:

```ts
// config/app.config.js
export default {
  port: 3000,
};

// src/index.js
import { jimpex } from 'jimpex';

const app = jimpex();
app.start();
```

Now, the really great feature about the config files, is that you could extend them and manage which one gets loaded depending on the environment: When loading the configuration, Jimpex will check the value of the environment variable `CONFIG` and try to load a config file `config/app.config.${CONFIG}.js`. For example:

You could have the default configuration with the port set to `3000`, and a "staging" configuration with the port set to `80`.

```ts
// config/app.config.js
export default {
  port: 3000,
};

// config/app.config.staging.js
export default {
  port: 80,
};
```

And if `CONFIG` is set to `staging` when the application starts, the staging configuration will be loaded.

Finally, you can access the configuration settings with the `config` service:

```ts
const port = app.get('config').get('port');
```

> You can read more about the options for the configuration service in the [options documentation](https://github.com/homer0/jimpex/blob/main/documents/options.md), but it's basically an implementation of [`@homer0/simple-config`](https://www.npmjs.com/package/@homer0/simple-config).

### 🚀 Starting the app

```js
app.listen(2509, () => {
  console.log('The app is running!');
});
```

Just like any other Node server, you can use the `listen` method and specify a port and a callback.

Now, if you you already have a `port` set on the configuration, you could use the `start` method; it works just like listen but it only receives a callback:

```js
app.start(() => {
  console.log('The app is running!');
});
```

And finally, you can also stop the application by calling...

```js
app.stop();
// Done, the app is not longer running.
```

### ✅ HTTPS

HTTPS is enabled via configuration, not options, just like the application port:

```ts
// config/app.config.js
export default {
  port: 2509,
  https: {
    enabled: true,
    credentials: {
      cert: '...cert-file',
      key: '...key-file',
    },
  },
};
```

By default, Jimpex will look for those files relative to the project root directory, but you can change so it will look on a path relative to the directory where the application executable is located by setting `https.credentials.onHome` to `false`.

#### HTTP2

To enable [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2), you MUST enable HTTPS first, and then just add a flag in the configuration:

```ts
// config/app.config.js
export default {
  port: 2509,
  https: {
    enabled: true,
    credentials: {
      cert: '...cert-file',
      key: '...key-file',
    },
  },
  http2: {
    enabled: true,
  },
};
```

Under the hood, Jimpex uses [Spdy](https://npmjs.com/package/spdy) for the HTTP/2 support, and Spdy has custom options you can send in order to define how it will work; you can send options to Spdy by adding a `spdy` key inside the `http2` object:

```ts
// config/app.config.js
export default {
  port: 2509,
  https: {
    enabled: true,
    credentials: {
      cert: '...cert-file',
      key: '...key-file',
    },
  },
  http2: {
    enabled: true,
    spdy: {
      'x-forwarded-for': '127.0.0.1',
    },
  },
};
```

### 🛠 Services

This is the most-core functionality that Jimple, and Jimpex, provide. You can easily create providers for services/resources that you want to use in your application:

```ts
// src/my-service.js
import { provider } from 'jimpex';

export class MyService {
  constructor(config) {
    this.config = config;
  }

  getMeThePort() {
    return this.config.get('port');
  }
}

export const myService = provider((app) => {
  app.set('myService', () => new MyService(app.get('config')));
});
```

> You could just export the provider, but I believe is a good practice to export both, in case another part of your app wants to extend the class and overwrite the service on the container.

The, on the app, you would simple `register` the provider:

```ts
import { Jimpex } from 'jimpex';
import { myService } from './my-service';

class MyApp extends Jimpex {
  boot() {
    this.register(myService);
  }
}
```

Done, your service is now available in the container.

Jimpex already comes with a few built-in service providers ready to be used, and you can read about them on the [services document](https://github.com/homer0/jimpex/blob/main/documents/services.md).

##### Configurable services

Since the version of Jimple that Jimpex uses under the hood is [`@homer0/jimple`](https://www.npmjs.com/package/@homer0/jimple), my custom "fork", you can also create "configureable providers":

```ts
// src/my-service.js
import { providerCreator } from 'jimpex';

export class MyService {
  constructor(config) {
    this.config = config;
  }

  getMeThePort() {
    return this.config.get('port');
  }
}

export const myService = providerCreator((options = {}) => (app) => {
  const { serviceName = 'myService' } = options;
  app.set(serviceName, () => new MyService(app.get('config')));
});
```

If you are thinking this is just a HOF, you are wrong. The "magic" of the creator version is that it can be used as a provider and/or as a function:

```ts
import { Jimpex } from 'jimpex';
import { myService } from './my-service';

class MyApp extends Jimpex {
  boot() {
    this.register(myService);
    this.register(
      myService({
        serviceName: 'myService2',
      }),
    );
  }
}
```

Check the README of [`@homer0/jimple`](https://www.npmjs.com/package/@homer0/jimple) for more information about providers.

### 🚦 Controllers

To define a controller, you just need to use the `controller` wrapper (like `provider`), modify a router, and return it:

```ts
// src/health-controller.js
import { controller } from 'jimpex';

// (Optional) Define a class to organize your route handlers.
export class HealthController {
  health() {
    return (req, res) => {
      res.write('Everything works!');
      res.end();
    };
  }
}

// Define the controller
export const healthController = controller((app) => {
  const ctrl = new HealthController();
  // Get an instance of the router service
  const router = app.get('router');
  // Return the router with all the routes
  return router.get('/', ctrl.health()).get('/health', (req, res) => {
    res.write('Everything works!');
    res.end();
  });
});
```

> 1. You could just export the controller, but I believe is a good practice to export both, in case another part of your app wants to extend the class and mount a new route with its inherited functionalities.
> 2. In case you are wondering about the lazy loading of the services that you may inject, the function inside the `controller` wrapper won't be called until the app is started.

Then, on you app, you would `mount` the controller:

```ts
import { Jimpex } from 'jimpex';
import { healthController } from './health-controller';

class MyApp extends Jimpex {
  boot() {
    this.mount('/health', healthController);
  }
}
```

Jimpex already comes with a few built-in controllers ready to be used, and you can read about them on the [controllers document](https://github.com/homer0/jimpex/blob/main/documents/controllers.md).

#### Configurable controllers

The same as with the services, you can define controllers that accept custom options for the moment they are mounted:

```ts
// src/health-controller.js
import { controllerCreator } from 'jimpex';

// (Optional) Define a class to organize your route handlers.
export class HealthController {
  health() {
    return (req, res) => {
      res.write('Everything works!');
      res.end();
    };
  }
}

// Define the controller
export const healthController = controllerCreator((options = {}) => (app) => {
  const ctrl = new HealthController();
  // Get an instance of the router service
  const router = app.get('router');
  // Read the custom options
  const { altRoute = '/health' } = options;

  // Return the router with all the routes
  return router.get('/', ctrl.health()).get(altRoute, (req, res) => {
    res.write('Everything works!');
    res.end();
  });
});
```

And like with the provider creators, these can be used as a controller, or as a function:

```ts
import { Jimpex } from 'jimpex';
import { healthController } from './health-controller';

class MyApp extends Jimpex {
  boot() {
    this.mount('/health', healthController);
    this.mount(
      '/hp',
      healthController({
        altRoute: '/status',
      }),
    );
  }
}
```

#### Controllers with services

If for some reason, your controller needs to register a service that the rest of the container needs to have access to, and you plan to do it on the `controller`/`controllerCreator` callback, you could end up messing with the _lazyness_ of the container: If a middleware or another controller tries to access the service and the controller that registers it is mounted after it, it will get an error as the service _doesn't exist yet_.

A way to solve this issue would be with a `provider`/`providerCreator`, mounting the controller:

```ts
// dont-do-this.js
import { provider, controller } from 'jimpex';

export const wrong = provider((app) => {
  app.set('wrong', () => new WrongService());
  app.mount(
    '/',
    controller((app) => {
      const wrong = app.get('wrong');
      return router.get('/', wrong.doSomething());
    }),
  );
});
```

The main problem with that approach is that you would have to `register` it as a provider, so the route for the controller would need to be defined inside the callback.

So, for this case, Jimpex has a special wrapper, which is very similar, but that it allows you to `mount` it:

```ts
// controller-provider.js
import { controllerProvider, controller } from 'jimpex';

export const good = controllerProvider((app) => {
  app.set('good', () => new GoodService());

  return controller((app) => {
    const good = app.get('good');
    return router.get('/', good.doSomething());
  });
});
```

The `controllerProvider` wrapper allows you to register something in the callback, and expects a wrapped `controller` to be returned. That way, you can `mount` it, and specify the root outside.

And like `provider`, and `controller`, there's also a `controllerProviderCreator`.

### ⚡️ Middlewares

To create a new middleware, you just need to use the `middleware` wrapper and return it:

```ts
// my-middleware.js
import { middleware } from 'jimpex';

// Define your middleware function (or class if it gets more complex)
export const greetingsMiddleware = () => (req, res, next) => {
  try {
    res.write('Hello World!');
    res.end();
  } catch (err) {
    next(err);
  }
};

// Define the middleware
export const greetings = middleware(() => greetingsMiddleware());
```

Then, on the app, you would `use` it:

```ts
import { Jimpex } from 'jimpex';
import { greetings } from './my-middleware';

class MyApp extends Jimpex {
  boot() {
    this.use(greetings);
  }
}
```

Now, middlewares can also be `mount`ed in specific routes:

```ts
import { Jimpex } from 'jimpex';
import { greetings } from './my-middleware';

class MyApp extends Jimpex {
  boot() {
    this.mount('/greetings', greetings);
  }
}
```

And, if you don't need access to the container in the middleware definition, you could also `mount`/`use` it as a _raw_ Express' middleware:

```ts
import { Jimpex } from 'jimpex';

const greetingsMiddleware = (req, res, next) => {
  try {
    res.write('Hello World!');
    res.end();
  } catch (err) {
    next(err);
  }
};

class MyApp extends Jimpex {
  boot() {
    this.use(greetingsMiddleware);
    // or
    this.mount('/greetings', greetingsMiddleware);
  }
}
```

Jimpex already comes with a few built-in middlewares ready to be used, and you can read about them on the [middlewares document](https://github.com/homer0/jimpex/blob/main/documents/middlewares.md).

#### Configurable middlewares

Just like the `controllerCreator` wrapper, you can also use the `middlewareCreator` wrapper to define middlewares that accept custom options:

```ts
// my-middleware.js
import { middlwareCreator } from 'jimpex';

// Define your middleware function (or class if it gets more complex)
export const greetingsMiddleware = (message) => (req, res, next) => {
  try {
    res.write(message);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Define the middleware
export const greetings = middleware((options) => {
  const { message = 'Hello Charo!' } = options;
  return greetingsMiddleware(message);
});
```

And now you can use it as a middleware, or as a function that returns a middleware:

```ts
import { Jimpex } from 'jimpex';
import { greetings } from './my-middleware';

class MyApp extends Jimpex {
  boot() {
    this.use(greetings);
    // or
    this.mount(
      '/greetings',
      greetings({
        message: 'Hello Pili!',
      }),
    );
  }
}
```

#### Middlewares with services

If, for some reason, your middleware needs to register a service before being mounted, just like the `controllerProvider`, you have the `middlewareProvider` wrapper:

```ts
// middleware-provider.js
import { middlewareProvider, middleware } from 'jimpex';

class MiddlewareService {
  getMiddleware() {
    return (req, res) => {
      res.write('Everything works!');
      res.end();
    };
  }
}

export const middlewareService = middlewareProvider((app) => {
  app.set('middlewareService', () => new MiddlewareService());

  return middleware((app) => {
    const service = app.get('middlewareService');
    return service.getMiddleware();
  });
});
```

And finally, you also have `middlewareProviderCreator` to create a middleware that can register a service, with custom options.

## 🤞 Examples

You can find the example projects in the `example` directory. To run them, you can use the `npm run example` command. By default, it runs the `basic` example, but you can also specify the name of the example you want to run:

```bash
npm run example [name-of-the-directory]
```

## 🤘 Development

### NPM scripts

| Script        | Description                          |
| ------------- | ------------------------------------ |
| `build`       | Transpiles the TypeScript code.      |
| `docs`        | Generates the project documentation. |
| `lint`        | Lints and formats the staged files.  |
| `lint:all`    | Lints the entire project code.       |
| `types:check` | Validates the types definitions.     |
| `test`        | Runs the project unit tests.         |
| `todo`        | Lists all the pending to-do's.       |
| `example`     | Runs an example project.             |

### Repository hooks

I use [`husky`](https://npmjs.com/package/husky) to automatically install the repository hooks:

| Hook         | Description                              |
| ------------ | ---------------------------------------- |
| `commit-msg` | Ensures the use of conventional commits. |
| `pre-commit` | Lints and formats the staged files.      |
| `pre-push`   | Validates the types and run the tests.   |
| `post-merge` | Updates the dependencies (`npm i`).      |

### Commits conventions

I use [conventional commits](https://www.conventionalcommits.org) with [`commitlint`](https://commitlint.js.org) in order to support semantic releases. The one that sets it up is actually `husky`, since it installs a script that runs `commitlint` on the commit message validation.

The configuration is on the `commitlint` property of the `package.json`.

### Releases

I use [`semantic-release`](https://npmjs.com/package/semantic-release) and a GitHub action to automatically release on NPM everything that gets merged to main.

The configuration for `semantic-release` is on `./releaserc` and the workflow for the release is on `./.github/workflow/release.yml`.

### Testing

I use [Jest](https://jestjs.io) to test the project.

The configuration file is on `./.jestrc.js`, the tests are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Code linting and formatting

For linting, I use [ESlint](https://eslint.org) with [my own custom configuration](https://npmjs.com/package/@homer0/eslint-plugin).

There are two configuration files, `./.eslintrc` for the source and the tooling, and `./tests/.eslintrc`, and there's also a `./.eslintignore` to exclude some files.

For formatting, I use [Prettier](https://prettier.io) with [my JSDoc plugin](https://npmjs.com/package/@homer0/prettier-plugin-jsdoc) and [my own custom configuration](https://npmjs.com/package/@homer0/prettier-config). The configuration file is `./.prettierrc`.

The script that runs them is `./utils/scripts/lint`; the script `lint-all` only runs ESLint, and runs it for the entire project.

### Documentation

I use [TypeDoc](https://typedoc.org) to generate an HTML documentation site for the project.

The configuration file is `./.typedoc.json` and the script that runs it is on `./utils/scripts/docs`.

## 👀 Motivation

A friend, who's also web developer, brought the idea of start using a dependency injection container on Node, and how Jimple was a great tool for it; from the moment I tried Jimple, I could never think of starting another project without it: It not only allows you to implement dependency injection on a simple and clean way, but it also kind of forces you to have a really good organization of your code.

A couple of months after that, the same friend told me that we should do something similar to [Silex](https://github.com/silexphp/Silex), which is based on Pimple, butwith Express. I ran with the idea and... this project is what I think a mix of Jimple and Express would look like. To be clear, **this is not a port of Silex**.
