# 🚦 Built-in Controllers

All of these controllers are available on the Jimpex package and can be easily required and implemented.

## Config

Allows you to see and switch the current configuration. It can be enabled or disabled by using a setting on the configuration.

- Module: `common`
- Requires: `responsesBuilder`

```ts
import { Jimpex, responsesBuilderProvider, configController } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilderProvider);

    // Add the controller.
    this.mount('/config', configController);
  }
}
```

Now, there are two rules behind this controller:

1. Your configuration must have a setting `debug.configurationController` with the value of `true`, otherwise the controller will be mounted, but no routes will be available.
2. To be able to switch configurations, the default configuration and/or the first configuration loaded must have a setting `allowConfigSwitch` set to `true`.

The reason for those rules is that this controller is for development/debugging purposes, as you wouldn't want to make public the settings of your app.

The controller then will mount two routes:

- `GET /`: It will show the current config.
- `GET /switch/:name`: It will, if allowed, switch to an specified config.

## Health

Shows the version and name of the configuration, just to check the app is running.

- Module: `common`
- Requires: `responsesBuilder`

```ts
import { Jimpex, responsesBuilderProvider, healthController } from 'jimpex';

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilderProvider);

    // Add the controller.
    this.mount('/health', healthController);
  }
}
```

That's all there is, the controller mounts only one route:

- `GET /`: Shows the information.

And the "health status" shown, is the one returned by the Jimpex option `healthCheck`.

## Statics

It allows your app to server specific files from any directory, without having to use the `static` middleware.

- Module: `common`
- Requires: `sendFile`

```ts
import { Jimpex, sendFileProvider, staticsController } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the controller.
    this.mount('/', staticsController);
  }
}
```

The controller comes with a lot of default options:

```ts
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

```ts
import { Jimpex, sendFileProvider, staticsController } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the controller.
    this.mount(
      '/',
      staticsController({
        paths: {
          route: 'public',
          source: 'secret-folder',
        },
        files: ['my-file-one.html', 'favicon.icon', 'index.html', 'some-other.html'],
      }),
    );
  }
}
```

You can even specify custom information to each individual file:

```ts
this.mount(
  '/',
  staticsController({
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
  }),
);
```

Finally, you can also add a custom middleware or middlewares to the routes created by the controller, you just need to use the `getMiddlewares` option and send a function that returns them:

```ts
/**
 * In this case, we'll use Jimpex's `ensureBearerToken` to protect the
 * file routes.
 */
const filesProtection = (app) => [app.get('ensureBearerToken')];

this.mount(
  '/',
  staticsController({
    files: ['index.html'],
    getMiddlewares: filesProtection,
  }),
);
```

And that's all, the middleware will be added to the route, just before serving the file.

## Gateway

It allows you to automatically generate a set of routes that will make gateway requests to an specific API.

- Module: `utils`
- Requires: `http`

```ts
import { Jimpex, httpProvider, gatewayController } from 'jimpex';

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpProvider);

    // Add the controller.
    this.mount('/gateway', gatewayController);
  }
}
```

The controller will look into your app configuration for a key called `api` with the following format:

```ts
{
  url: 'api-entry-point',
  gateway: {
    endpointOne: 'endpoint/one/path',
  },
}
```

Based on the example above and that configuration, the controller would mount a route on `/gateway/endpoint/one/path` that would fire a request to `api-entry-point/endpoint/one/path`.

The controller has a few options that you can customize:

```ts
{

  // The name that will be used to register the controller as a sevice (yes!),
  // so other services can access the API Client configuration the controller
  // generates from its routes.

  serviceName: 'apiGateway',

  // The name of a registered service that will work as a helper, and that the
  // controller will call in order to modify requests, responses and even handle
  // errors.
  helperServiceName: 'apiGatewayHelper',

  // The name of the configuration property where the gateway settings are stored.
  // This is also used to wrap the endpoints on the generated API Client configuration.
  gatewaySettingName: 'api',

  // This is a helper for when the gateway is used with an API client. The idea is
  // that, by default, the routes are mounted on the controller route, but with
  // this option, you can specify another sub path. For example: The controller
  // is mounted on `/routes`, if you set `root` to `gateway`, all the routes will
  // be on `/routes/gateway`.
  root: '',

  // How the gateway will handle headers from requests and responses.
  headers: {

    // Whether or not to include the header with a request real IP.
    useXForwardedFor: true,

    // Whether or not to copy the custom headers (the ones that start with `x-`).
    copyCustomHeaders: true,

    // A list of headers that will be copied from the incoming request into the
    // fetch request.
    copy: [
      'authorization',
      'content-type',
      'referer',
      'user-agent',
    ],

    // A list of headers that will be removed while copying the headers from a
    // fetch response into the server's response.
    remove: [
      'server',
      'x-powered-by',
      'content-encoding',
    ],
  },
}
```

The way you overwrite them is by calling the controller as a function:

```ts
import { Jimpex, httpProvider, gatewayController } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpProvider);

    // Add the controller.
    this.mount(
      '/gateway',
      gatewayController({
        serviceName: 'Batman',
      }),
    );
  }
}
```

I strongly recommend you to read the techinical documentation in order to know all the things you can do with the helper service and the logic behind the naming convetion the controller creator enforces (the `serviceName` must end with `Gateway`, among other things).
