# Built-in Controllers

All of these controllers are available on the Jimpex package and can be easily required and implemented.

## Configuration

Allows you to see and switch the current configuration. It can be enabled or disabled by using a setting on the configuration.

- Module: `common`
- Requires: `responsesBuilder`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
  },
  controllers: {
    common: { configurationController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    
    // Add the controller.
    this.mount('/config', configurationController);
  }
}
```

Now, there are two rules behind this controller:

1. Your configuration must have a setting `debug.configurationController` with the value of `true`.
2. To be able to switch configurations, the default configuration and/or the first configuration loaded must have a setting `allowConfigurationSwitch` set to `true`.

The reason for those rules is that this controller is development purposes as you wouldn't want to make public the settings of your app.

The controller then will mount two routes:

- `GET /`: It will show the current configuration.
- `GET /switch/:name`: It will, if allowed, switch to an specified configuration.

## Health

Shows the version and name of the configuration, just to check the app is running.

- Module: `common`
- Requires: `responsesBuilder`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
  },
  controllers: {
    common: { healthController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    
    // Add the controller.
    this.mount('/health', healthController);
  }
}
```

That's all there is, the controller mounts only one route:

- `GET /`: Shows the information.

## Statics

It allows your app to server specific files from any directory, without having to use the `static` middleware.

- Module: `common`
- Requires: `sendFile`

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  controllers: {
    common: { staticsController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the controller.
    this.mount('/', staticsController);
  }
}
```

The controller comes with a lot of default options:

```js
{
  // The list of files it will serve.
  files: ['favicon.ico', 'index.html'],
  // The HTTP methods for which it will mount routes.
  methods: {
    // If `all` is `true`, then all the others are ignored.
    all: false,
    get: true,
  },
  // The "master" paths to prepend to all file routes and files.
  paths: {
    // The base route from where the files are going to be served.
    route: '',
    // The base path from where the files are located.
    source: './',
  },
}
```
All of those values can be customized by calling the controller as a function:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  controllers: {
    common: { staticsController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the controller.
    this.mount('/', staticsController({
      paths: {
        route: 'public',
        source: 'secret-folder',
      }
      files: [
        'my-file-one.html',
        'favicon.icon',
        'index.html',
        'some-other.html',
      ],
    }));
  }
}
```

You can also specify custom information to each individual file:

```js
this.mount('/', staticsController({
  files: [
    'my-file-one.html',
    {
      route: 'favicon.ico',
      source: 'icons/fav/icon.ico',
      headers: {
        'X-Custom-Icon-Header': 'Something!',
      },
    },
    'index.html',
  ],
}));
```

Finally, you can also add a custom middleware or middlewares to the routes created by the controller, you just need to send a function that returns the middlewares when called.

```js
/**
 * In this case, we'll use Jimpex's `ensureBearerToken` to protect the
 * file routes.
 */
const filesProtection = (app) => [app.get('ensureBearerToken')];

this.mount('/', staticsController(
  {
    files: [
      'index.html',
    ],
  },
  [filesProtection]
));
```

And that's all, the middleware will be added to the route, just before serving the file.
