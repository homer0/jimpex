# Jimpex

Express as dependency injection container.

Jimpex is an implementation of [Express](https://expressjs.com), one of the most popular web frameworks for Node, using [Jimple](https://github.com/fjorgemota/jimple), a Javascript port of [Pimple](https://pimple.symfony.com/) dependency injection container.

## Usage

### Creating your app

To create a Jimpex app you would require the `Jimpex` class from the package, extend it and define all your services, controllers and middlewares on its `boot` method:

```js
const { Jimpex } = require('jimpex');

class MyApp extends Jimpex {
  boot() {
    // Do all your custom stuff...
  }
}
```

The class constructor has two parameters:

1. `boot` (`true`): Whether or not to call the `boot` method after initializing the instance.
2. `options` (`{}`): A set of options to customize the app.

There are a lot of options to customize an app, so I would recommend you to read the [Jimpex Options documentation](./documents/options.md).

#### App configuration

Jimpex, by default, depends on external configuration files and as a base configuration it will try to load `./config/app/app.config.js`. Of course this is extremely configurable through the [Jimpex Options](./documents/options.md).

A configuration file is just a Javascript file that exports an Object, for example:

```js
module.exports = {
  port: 2509,
};
```

> If that's who you default configuration file looks like, the app will run on the port `2509`.

To access the app configuration, you just call the `appConfiguration` service:

```js
const config = app.get('appConfiguration');
```

Then you can read its values using `.get(setting)`:

```js
console.log(config.get('port'));
// Will log 2509
```

To more information about how the `appConfiguration` service works, you can check [its documentation on the wootils repository](https://github.com/homer0/wootils/blob/master/documents/node/appConfiguration.md).

#### Starting the app

To start the app you need a valid configuration file with a valid `port` setting. Check the previous section to more information about it.

Now, Starting the app is as easy as calling `start()`:

```js
app.start(() => {
  console.log('The app is running!');
});
```

> - Like Express, you can send a callback to be executed after the server starts.
> - You also have a `listen` alias with the same signature as express (port and callback) for serverless platforms where you don't manually start the app.

You can also stop the app by calling `stop()`:

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

Under the hood, Jimpex uses [Spdy](https://yarnpkg.com/package/spdy) for the HTTP/2 support, and Spdy has custom options you can send it in order to define how it will work; you can send options to Spdy by adding a `spdy` key inside the `http2` object:

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

To define a service and its provider, you would write your service as a `class` or a `function` and then wrap it on the `provider` function Jimpex provides:

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
module.exports = {
  MyService,
  myService,
};
```

> You could export just export the provider, but I believe is a good practice to export both in case another part of your app wants to extend the class and overwrite the service on the container.

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
  // Return the list of routes this controller will handle
  return [
    router.get('/', ctrl.health()),
  ];
});

// Export the controller class and the controller itself
module.exports = {
  HealthController,
  healthController,
};
```

> - You could export just export the controller, but I believe is a good practice to export both in case another part of your app wants to extend the class and mount a new route withs its inherit functionalities.
> - The function inside the `controller` wrapper won't be called until the app is started. In case you are wondering about the lazy loading of the services that you may inject.

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
  // Return the list of routes this controller will handle
  return [
    router.get('/', ctrl.health()),
  ];
});

// Export the controller class and the controller itself
module.exports = {
  HealthController,
  healthController,
};
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
module.exports = {
  greetingsMiddleware,
  greetings,
};
```

> You could export just export the provider, but I believe is a good practice to export both in case another part of your app wants to extend the class or use the function.

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
module.exports = {
  greetingsMiddleware,
  greetings,
};
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

- **API client:** An implementation of the [wootils API Client](https://github.com/homer0/wootils/blob/master/documents/shared/APIClient.md) but that is connected to the HTTP service, to allow logging and forwarding of the headers.
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

- [`appLogger`](https://github.com/homer0/wootils/blob/master/documents/node/logger.md): The logger service.
- [`environmentUtils`](https://github.com/homer0/wootils/blob/master/documents/node/environmentUtils.md): The service that reads the environment variables.
- [`packageInfo`](https://github.com/homer0/wootils/blob/master/documents/node/packageInfo.md): The app package.json information.
- [`pathUtils`](https://github.com/homer0/wootils/blob/master/documents/node/pathUtils.md): The service to build paths relative to the project root directory.
- [`rootRequire`](https://github.com/homer0/wootils/blob/master/documents/node/rootRequire.md): The service to make requires relatives to the project root directory.
- [`events`](https://github.com/homer0/wootils/blob/master/documents/shared/eventsHub.md): To handle the app events.

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

I use [`husky`](https://yarnpkg.com/package/husky) to automatically install the repository hooks so the code will be tested and linted before any commit and the dependencies updated after every merge.

The configuration is on the `husky` property of the `package.json` and the hooks' files are on `./utils/hooks`.

### Testing

I use [Jest](https://facebook.github.io/jest/) to test the project.

The configuration file is on `./.jestrc.json`, the tests are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](https://eslint.org) with [my own custom configuration](https://yarnpkg.com/package/eslint-plugin-homer0) to validate all the JS code and the JSDoc comments.

The configuration file for the project code is on `./.eslintrc` and the one for the tests is on `./tests/.eslintrc`, and there's also an `./.eslintignore` to exclude some files on the process. The script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [JSDoc](https://jsdoc.app) to generate an HTML documentation site for the project.

The configuration file is on `./.jsdoc.js` and the script that runs it is on `./utils/scripts/docs`.

### To-Dos

I use `@todo` comments to write all the pending improvements and fixes, and [Leasot](https://yarnpkg.com/en/package/leasot) to generate a report. The script that runs it is on `./utils/scripts/todo`.

## Motivation/Introduction

A friend who's also web developer brought the idea of start using a dependency injection container on Node, and how Jimple was a great tool for it, and from that moment on I can't think of starting an app without using it. It not only allows you to implement dependency injection on a simple and clean way but it also kind of forces you to have a really good organization of your code.

A couple of months after that, the same friend told me that we should do something similar to [Silex](https://silex.symfony.com/), which is based on Pimple, with Express. I ran with the idea and... this project is what I think a mix of Jimple and Express would look like. To be clear, **this is not a port of Silex**.
