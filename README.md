# Jimpex

[![GitHub Workflow Status (main)](https://img.shields.io/github/workflow/status/homer0/jimpex/Test/main?style=flat-square)](https://github.com/homer0/jimpex/actions?query=workflow%3ATest)
[![Coveralls GitHub](https://img.shields.io/coveralls/github/homer0/jimpex.svg?style=flat-square)](https://coveralls.io/github/homer0/jimpex?branch=main)
[![David](https://img.shields.io/david/homer0/jimpex.svg?style=flat-square)](https://david-dm.org/homer0/jimpex)
[![David](https://img.shields.io/david/dev/homer0/jimpex.svg?style=flat-square)](https://david-dm.org/homer0/jimpex)

Express as dependency injection container.

Jimpex is an implementation of [Express](https://expressjs.com), one of the most popular web frameworks for Node, using [Jimple](https://github.com/fjorgemota/jimple), a Javascript port of [Pimple](https://pimple.symfony.com) dependency injection container.

## Usage

### Creating your app

You have two ways of creating an app: by defining a class and using the `boot` method to add all your services and customizations; or with the `jimpex` function:

#### Class

```js
const { Jimpex } = require('jimpex');
// OR import { Jimpex } from 'jimpex/esm';

class MyApp extends Jimpex {
  boot() {
    // Do all your custom stuff...
    this.register(...);
    this.mount(...);
  }
}
```

The class constructor has two parameters:

```js
(options = {}, configuration = null) => Jimpex
```

1. The options to customize the application. You can read about them on the [Jimpex Options documentation](./documents/options.md).
2. The default configuration, in case you don't want Jimpex to try loading an external configuration file.

When definining the application as a class, there are two _protected_ (helper) methods that you can use to overwrite the options and even define priority resources that the implementation could access/overwrite if they manually handle the "boot":

##### Adding resources that can be overriden

```js
class MyApp extends Jimpex {
  _init() {
    this.set('env', 'PROD');
  }
}
```

The `_init` method is called before `boot` gets validated, so even if the constructor option `boot` is set to `false`, `_init` will be called.

Now, let's say you want to execute the application on a development environment; instead of adding `if`s to check the environment, you could do something like this on your development file:

```js
const MyApp = require('...');

const app = new MyApp({ boot: false });
app.set('env', 'DEV');
app.boot();
...
```

##### Modifying the options

```js
class MyApp extends Jimpex {
  _initOptions() {
    return {
      configuration: {
        loadFromEnvironment: false,
      },
    };
  }
}
```

If you are subclassing `Jimpex`, it highly probable that if the default options need to be changed, you would want to do it from within the class, rather than forcing all implementations to do it.

One way would be to overwrite the constructor and call `super` with the customizations, the other would be using this method: The constructor automatically merges the result of `_initOptions` on top of the defaults so you won't have to override anything.

There are a lot of different options, so I would recommend reading the [Jimpex Options documentation](./documents/options.md).

#### Function

```js
const { jimpex } = require('jimpex');
// OR import { jimpex } from 'jimpex/esm';

const app = jimpex();
app.register(...);
app.mount(...);
```

The idea of the function is to be used on scenarios where a class may be too much or you have a single implementation, like on a lamda serverless.

The function has almost the same signature as the class constructor:

```js
(options = {}, configuration = null) => Jimpex
```

1. The options to customize the application. You can read about them on the [Jimpex Options documentation](./documents/options.md).
2. The default configuration. The big difference here is that, even if you send `null`, Jimpex won't try to load an external configuration file.

#### App configuration

Jimpex, by default, depends on external configuration files and, as a base configuration, it will try to load `./config/app/app.config.js`. Of course this is extremely configurable through the [Jimpex Options](./documents/options.md).

A configuration file is just a Javascript file that exports an Object, for example:

```js
module.exports = {
  port: 2509,
};
```

> If that's how you default configuration file looks like, the app will run on the port `2509`.

If you don't want the application to load an external file, you could use the second parameter of either the class or the function:

```js
new MyApp({ ... }, { port: 2509 });
// OR
jimpex({ ... }, { port: 2509 });
```

Now, to access the configuration service, you just call `appConfiguration`:

```js
const config = app.get('appConfiguration');
```

Then you can read its settings using `.get(setting)`:

```js
console.log(config.get('port'));
// Will log 2509
```

To get more information about how the `appConfiguration` service works, you can check [its documentation on the wootils repository](https://github.com/homer0/wootils/blob/main/documents/node/appConfiguration.md).

#### Starting the application

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

### HTTPS && HTTP2

To enable HTTPS on your application, just like for the `port`, you need to create a `https` key on your configuration, "enable it" and provide the paths for the credentials:

```js
module.exports = {
  port: 2509,
  https: {
    enabled: true,
    credentials: {
      cert: 'cert-file',
      key: 'key-file',
    },
  },
};
```

By default, Jimpex will look for those files relative to the project root directory, but you can change so it will look on a path relative to the directory where the application executable is located:

```js
{
  // ...
  credentials: {
    onHome: false,
    cert: 'cert-file',
    key: 'key-file',
  },
}
```

Also, once you have HTTPS enabled, you can also enable [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2):

```js
module.exports = {
  port: 2509,
  https: {
    enabled: true,
    credentials: {
      cert: 'cert-file',
      key: 'key-file',
    },
  },
  http2: {
    enabled: true,
  },
};
```

> **Important:** HTTPS MUST BE enabled in order to use HTTP/2.

Under the hood, Jimpex uses [Spdy](https://yarnpkg.com/package/spdy) for the HTTP/2 support, and Spdy has custom options you can send in order to define how it will work; you can send options to Spdy by adding a `spdy` key inside the `http2` object:

```js
{
  // ...
  http2: {
    enabled: true,
    spdy: {
      'x-forwarded-for': '127.0.0.1',
    },
  },
}
```

### Defining a service

To define a service and its provider, you would write your service as a `class` or a `function` and then wrap it on the `provider` function Jimpex exports:

```js
const { provider } = require('jimpex');

// Create your service
class MyService {
  constructor(depOne, depTwo);
}

// Define the provider
const myService = provider((app) => {
  app.set('myService', () => new MyService(
    app.get('depOne'),
    app.get('depTwo')
  ));
});

// Export the service and its provider
module.exports.MyService = MyService;
module.exports.myService = myService;
```

> 1. You could just export the provider, but I believe is a good practice to export both in case another part of your app wants to extend the class and overwrite the service on the container.
> 2. That why of using `module.expots` is so the class can be imported on JSDoc comments.

Then, on you app, you would simple `register` the provider:

```js
const { Jimpex } = require('jimpex');
const { myService } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.register(myService);
  }
}
```

Done, your service is now available.

#### Defining a configurable service

In case you want to create a service that could accept custom setting when instantiated, you can use a _"provider creator"_:

```js
const { providerCreator } = require('jimpex');

// Create your service
class MyService {
  constructor(depOne, depTwo, options = {});
}

// Define the provider
const myService = providerCreator((options) => (app) => {
  app.set('myService', () => new MyService(
    app.get('depOne'),
    app.get('depTwo'),
    settings
  ));
});

// Export the service and its provider
module.exports = {
  MyService,
  myService,
};
```

The special behavior the creators have, is that you can call them as a function, sending the settings, or just use them on the `register`, so **it's very important that the settings must be optional**:

```js
const { Jimpex } = require('jimpex');
const { myService } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.register(myService);
    // or
    this.register(myService({ ... }));
  }
}
```

### Adding a controller

To add controller you need to use the `controller` function and return a list of routes:

```js
const { controller } = require('jimpex');

// (Optional) Define a class to organize your route handlers.
class HealthController {
  health() {
    return (req, res) => {
      res.write('Everything works!');
    };
  }
}

// Define the controller
const healthController = controller((app) => {
  const ctrl = new HealthController();
  // Get the router service
  const router = app.get('router');
  // Return the router with all the routes
  return router
  .get('/', ctrl.health())
  .get(...);
});

// Export the controller class and the controller itself
module.exports.HealthController = HealthController;
module.exports.healthController = healthController;
```

> 1. You could just export the controller, but I believe is a good practice to export both in case another part of your app wants to extend the class and mount a new route withs its inherit functionalities.
> 2. That why of using `module.expots` is so the class can be imported on JSDoc comments.
> 3. The function inside the `controller` wrapper won't be called until the app is started. In case you are wondering about the lazy loading of the services that you may inject.

Then, on you app, you would `mount` the controller:

```js
const { Jimpex } = require('jimpex');
const { healthController } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.mount('/health', healthController);
  }
}
```

#### Defining a configurable controller

Like with _"providers creators", you can define controllers that accept custom settings when
instantiated, using a _"controller creator"_:

```js
const { controllerCreator } = require('jimpex');

// (Optional) Define a class to organize your route handlers.
class HealthController {
  constructor(settings = {});

  health() {
    return (req, res) => {
      res.write('Everything works!');
    };
  }
}

// Define the controller
const healthController = controllerCreator((settings) => (app) => {
  const ctrl = new HealthController(settings);
  // Get the router service
  const router = app.get('router');
  // Return the router with all the routes
  return router
  .get('/', ctrl.health())
  .get(...);
});

// Export the controller class and the controller itself
module.exports.HealthController = HealthController;
module.exports.healthController = healthController;
```

The special behavior the creators have, is that you can call them as a function, sending the settings, or just use them with `mount` as regular controllers; and since they can be used as regular controllers, **it's very important that the settings are optional**:

```js
const { Jimpex } = require('jimpex');
const { healthController } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.mount('/health', healthController);
    // or
    this.mount('/health', healthController({ ... }));
  }
}
```

#### Defining a controller that registers a service

If for some reason, your controller needs to register a service the rest of the container needs to have access to and you plan to do it on the `controller`/`controllerCreator` callback, you could end up messing with the _lazyness_ of the container: If a middleware or another controller tries to access the service and the controller that registers it is mounter after it, it will get an error as the service doesn't exist yet.

To solve this issue, you can use a "controller provider":

```js
const { provider, controller } = require('jimpex');

// (Optional) Define a class to organize your route handlers.
class HealthController {
  health() {
    return (req, res) => {
      res.write('Everything works!');
    };
  }
}

// Define the controller
const healthController = provider(app) => {
  // Register the controller as a service (or any other resource)
  app.set('health', () => new HealthController());
  return controller(() => {
    // Get the controller as a service
    const ctrl = app.get('health');
    // Get the router service
    const router = app.get('router');
    // Return the router with all the routes
    return router
    .get('/', ctrl.health())
    .get(...);
  });
});

// Export the controller class and the controller itself
module.exports.HealthController = HealthController;
module.exports.healthController = healthController;
```

And you would mount it just like any other contorller:

```js
const { Jimpex } = require('jimpex');
const { healthController } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.mount('/health', healthController);
  }
}
```

And in the case you need a "creator", you could use a "provider creator" and return a controller:

```js
const healthController = providerCreator((settings) => (app) => {
  // Register the controller as a service (or any other resource) and send the settings
  app.set('health', () => new HealthController(settings));
  return controller(() => {
    // Get the controller as a service
    const ctrl = app.get('health');
    // Get the router service
    const router = app.get('router');
    // Return the router with all the routes
    return router
    .get('/', ctrl.health())
    .get(...);
  });
});
```

### Adding a middleware

To add a new middleware you need to use the `middleware` function and return a function:

```js
const { middlware } = require('jimpex');

// Define your middleware function (or class if it gets more complex)
const greetingsMiddleware = () => (req, res, next) => {
  console.log('Hello!');
};

// Define the middleware
const greetings = middleware(() => greetingsMiddleware());

// Export the function and the middleware
module.exports.greetingsMiddleware = greetingsMiddleware;
module.exports.greetings = greetings;
```

> 1. You could just export the provider, but I believe is a good practice to export both in case another part of your app wants to extend the class or use the function.
> 2. That why of using `module.expots` is so the function can be imported on JSDoc comments.

Then, on you app, you would `use` the controller:

```js
const { Jimpex } = require('jimpex');
const { greetings } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.use(greetings);
  }
}
```

#### Defining a configurable middleware

Like with controllers and providers, you can also create a middleware that can accept settings when instantiated, with a _"middleware creator"_:

```js
const { middlwareCreator } = require('jimpex');

// Define your middleware function (or class if it gets more complex)
const greetingsMiddleware = (message = 'Hello!') => (req, res, next) => {
  console.log(message);
};

// Define the middleware
const greetings = middlewareCreator((message) => greetingsMiddleware(message));

// Export the function and the middleware
module.exports.greetingsMiddleware = greetingsMiddleware;
module.exports.greetings = greetings;
```

The special behavior the creators have, is that you can call them as a function, sending the settings, or just register them with `use` as regular middlewares, so **it's very important that the settings must be optional**:

```js
const { Jimpex } = require('jimpex');
const { greetings } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.use(greetings);
    // or
    this.use(greetings('Howdy!'));
  }
}
```

#### Defining a middleware that registers a service

Just like the "controller provider", you can also create a "middleware provider", a middleware that also registers something on the contianer without messing with the _lazyness_ of the container:

```js
const { provider, middleware } = require('jimpex');
// Define the class that will work as a service
class Greeter {
  // Add a method that could be used on its "service role"
  greet() {
    return 'Hello!';
  }
  // Add a method for the actual middleware
  middleware() {
    return (req, res, next) => {
      console.log(this.greet());
    };
  }
}
// Define the provider
const greetings = provider((app) => {
  // Register the class as a service
  app.set('greeter', () => new Greeter());
  // Return the actual middleware
  return middleware(() => app.get('greeter').middleware());
})

// Export the class and the provider
module.exports.greetingsMiddleware = greetingsMiddleware;
module.exports.greetings = greetings;
```

And you would mount it just like any other contorller:

```js
const { Jimpex } = require('jimpex');
const { greetings } = require('...');

class MyApp extends Jimpex {
  boot() {
    ...
    this.use(greetings);
  }
}
```

And in the case you need a "creator", you could use a "provider creator" and return a controller:

```js
const greetings = providerCreator((settings) => (app) => {
  // Register the class as a service and send the settings
  app.set('greeter', () => new Greeter(settings));
  // Return the actual middleware
  return middleware(() => app.get('greeter').middleware());
});
```

### Proxy mode

You can enable the "proxy mode" by setting the `proxy` option to `true` on either the function or the class and it allows you to access and register resources using dot notation:

```js
// Set the option
const app = jimpex({ proxy: true });

app.myService = () => new MyService();
// = app.set('myService', () => new MyService();

app.myService.doSomething();
// = app.get('myService').doSomething();

doSomething(app.$myService);
// = doSomething(app.try('myService'));
```

When using the class, as you would expect, the constructor would give you the original instance and then you would have to call `.ref()` to get either the proxy or the original (depending on the setting):

```js
const original = new Jimpex({ proxy: true });
const app = original.ref();
```

But for the function, what you get as return value is actually the call for `.ref()`, that's why the first example could use the proxy mode without calling it.

Internally, when `proxy` is enabled, all providers, controllers and middlewares will receive the proxy instead of the original.

## Built-in features

Jimpex comes with a few services, middlewares and controllers that you can import and use on your app, some of them [are activated by default on the options](./documents/options.md), but others you have to implement manually:

### Controllers

- **Configuration:** Allows you to see and switch the current configuration. It can be enabled or disabled by using a setting on the configuration.
- **Health:** Shows the version and name of the configuration, just to check the app is running.
- **Statics:** It allows your app to server specific files from any directory, without having to use the `static` middleware.
- **Gateway:** It allows you to automatically generate a set of routes that will make gateway requests to an specific API.

[Read more about the built-in controllers](./documents/controllers.md)

### Middlewares

- **Error handler:** Allows you to generate responses for errors and potentially hide uncaught exceptions under a generic message, unless it's disabled via configuration settings.
- **Force HTTPS:** Redirect all incoming traffic from HTTP to HTTPS. It also allows you to set routes to ignore the redirection.
- **HSTS header:** It configures a `Strict-Transport-Security` header and includes it on every response.
- **Fast HTML:** Allows your app to skip unnecessary processing by showing an specific HTML when a requested route doesn't have a controller for it or is not on a "whitelist".
- **Show HTML:** A really simple middleware to serve an HTML file. Its true feature is that it can be hooked up to the **HTML Generator** service.
- **Version validator:** If you mount it on a route it will generate a `409` error if the request doesn't have a version parameter with the same version as the one on the configuration.

[Read more about the built-in controllers](./documents/middlewares.md)

### Services

- **API client:** An implementation of the [wootils API Client](https://github.com/homer0/wootils/blob/main/documents/shared/APIClient.md) but that is connected to the HTTP service, to allow logging and forwarding of the headers.
- **App Error:** A very simple subclass of `Error` but with support for context information. It can be used to customize the error handler responses.
- **Ensure bearer token:** A service-middleware that allows you to validate and retrieve a bearer token from the incoming requests `Authorization` header.
- **HTTP Error:** Another type of error, but specific for the HTTP requests the app does with the API client.
- **Send File:** It allows you to send a file on a response with a path relative to the app executable.
- **Frontend Fs:** Useful for when your app has a bundled frontend, it allows you to read, write and delete files with paths relative to the app executable.
- **HTML Generator:** A service that allows you to generate an HTML file when the app gets started and inject contents of the configuration as a `window` variable.
- **HTTP:** A set of utilities to work with HTTP requests and responses.
- **Responses builder:** A service that generates JSON and HTML responses.

[Read more about the built-in services](./documents/services.md)

The service also implements a few other services from the [wootils](https://github.com/homer0/wootils) as core utilities:

- [`appLogger`](https://github.com/homer0/wootils/blob/main/documents/node/logger.md): The logger service.
- [`environmentUtils`](https://github.com/homer0/wootils/blob/main/documents/node/environmentUtils.md): The service that reads the environment variables.
- [`packageInfo`](https://github.com/homer0/wootils/blob/main/documents/node/packageInfo.md): The app package.json information.
- [`pathUtils`](https://github.com/homer0/wootils/blob/main/documents/node/pathUtils.md): The service to build paths relative to the project root directory.
- [`rootRequire`](https://github.com/homer0/wootils/blob/main/documents/node/rootRequire.md): The service to make requires relatives to the project root directory.
- [`events`](https://github.com/homer0/wootils/blob/main/documents/shared/eventsHub.md): To handle the app events.

## Development

### NPM/Yarn Tasks

| Task       | Description                          |
|------------|--------------------------------------|
| `docs`     | Generates the project documentation. |
| `lint`     | Lints the staged files.              |
| `lint:all` | Lints the entire project code.       |
| `test`     | Runs the project unit tests.         |
| `todo`     | Lists all the pending to-do's.       |

### Repository hooks

I use [`husky`](https://yarnpkg.com/package/husky) to automatically install the repository hooks so the code will be tested and linted before any commit, and the dependencies updated after every merge.

#### Commits convention

I use [conventional commits](https://www.conventionalcommits.org) with [`commitlint`](https://commitlint.js.org) in order to support semantic releases. The one that sets it up is actually husky, that installs a script that runs `commitlint` on the `git commit` command.

The configuration is on the `commitlint` property of the `package.json`.

### Releases

I use [`semantic-release`](https://yarnpkg.com/package/semantic-release) and a GitHub action to automatically release on NPM everything that gets merged to main.

The configuration for `semantic-release` is on `./releaserc` and the workflow for the release is on `./.github/workflow/release.yml`.

### Testing

I use [Jest](https://facebook.github.io/jest/) to test the project.

The configuration file is on `./.jestrc.json`, the tests are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Code linting and formatting

For linting, I use [ESlint](https://eslint.org) with [my own custom configuration](https://yarnpkg.com/package/@homer0/eslint-plugin); there are two configuration files, `./.eslintrc` for the source and the tooling, and `./tests/.eslintrc`, and there's also a `./.eslintignore` to exclude some files.

And for formatting, I use [Prettier](https://prettier.io) with [my JSDoc plugin](https://yarnpkg.com/package/@homer0/prettier-plugin-jsdoc) and [my own custom configuration](https://yarnpkg.com/package/@homer0/prettier-config). The configuration file is `./.prettierrc`.

The script that runs them is `./utils/scripts/lint`; the script `lint-all` only runs ESLint, and runs it for the entire project.

### Documentation

I use [JSDoc](https://jsdoc.app) to generate an HTML documentation site for the project.

The configuration file is `./.jsdoc.js` and the script that runs it is on `./utils/scripts/docs`.

### To-Dos

I use `@todo` comments to write all the pending improvements and fixes, and [Leasot](https://yarnpkg.com/en/package/leasot) to generate a report. The script that runs it is on `./utils/scripts/todo`.

## Motivation/Introduction

A friend who's also web developer brought the idea of start using a dependency injection container on Node, and how Jimple was a great tool for it, and from that moment on I can't think of starting an app without using it. It not only allows you to implement dependency injection on a simple and clean way but it also kind of forces you to have a really good organization of your code.

A couple of months after that, the same friend told me that we should do something similar to [Silex](https://silex.symfony.com/), which is based on Pimple, with Express. I ran with the idea and... this project is what I think a mix of Jimple and Express would look like. To be clear, **this is not a port of Silex**.
