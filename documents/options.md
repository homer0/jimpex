# Jimpex Options

The options the second parameter of the class constructor and it allows you to customize almost every aspect of Jimpex.

This is what the options object looks like:

```js
{
  // The version of the app
  version: '0.0.0',

  // The size limit for the requests payload.
  filesizeLimit: '15MB',

  // The options to customize how the app configuration is loaded (details on its section).
  configuration: ...,

  // The options for the static middleware (details on its section).
  statics: ...,

  // The options to customize the express instance and default middlewares (details on its section).
  express: ...,

  // Which built-in services to register (details on its section).
  defaultServices: ...
}
```

Besides the first two, which default values and descriptions are pretty clear, I'll go in detail for all the others.

## Configuration

This set of options allows you to customize every aspect of how the configuration service is created. Remember that the app requires a valid configuration with a `port` setting to be started:

```js
{
  // The default configuration. If the value is null, it will load [app-name].config.js
  default: null,

  // The name of the app, to be used on the configurations directory and filenames.
  name: 'app',

  // The path relative to the root directory where the configurations are located.
  path: 'config/',

  // If `true`, the path to the configuration will add a folder with the name of the app.
  hasFolder: true,

  // The environment variable the app will check for a configuration name.
  environmentVariable: 'CONFIG',

  // Whether or not to check for the environment variable.
  loadFromEnvironment: true,

  // If `true`, the version of the app will be copied from the loaded configuration.
  loadVersionFromConfiguration: true,

  // The name format of the configuration files.
  filenameFormat: '[app-name].[configuration-name].config.js',
}
```

As you can see, if you don't want to depend on environment variables or just have one single configuration for your app, you can use the `default` option and turn `loadFromEnvironment` to `false`.

The configuration service is an implementation of [wootils AppConfiguration](https://github.com/homer0/wootils/blob/main/documents/node/appConfiguration.md), so you can check its API in its oficial configuration.

## Statics

These options are specifically for the Express [`static`](https://github.com/expressjs/serve-static) middleware:

```js
{
  // Whether or not to enable the middleware to serve statics files.
  enabled: true,

  // If true, the statics folder would be relative to the project root directory, otherwise,
  // it would be relative to the app executable.
  onHome: false,

  // The name of both the route and the folder, relative to whatever you defined with the
  // `onHome` option.
  route: 'statics',

  // By default, the folder will be the same as the `route`, but you can use this option
  // to define a relative path that won't affect the route.
  folder: '',
}
```

## Express

These are options for miscellaneous things you can add to the Express server:

```js
{
  // Whether or not to enable the `trust proxy` option.
  trustProxy: true,

  // Whether or not to remove the `x-powered-by` header.
  disableXPoweredBy: true,

  // Whether or not to add the `compression` middleware.
  compression: true,

  // Whether or not to add the `body-parser` middleware.
  bodyParser: true,

  // Whether or not to add the `multer` middleware.
  multer: true,
}
```

## Default services

These options allow you to register some of the built-in service that I consider useful enough to be added on any app.

```js
{
  // These services include:
  // - Error handler
  // - Send File
  common: true,

  // These services include:
  // - API client
  // - HTTP
  // - Responses builder
  http: true,

  // These services include:
  // - Ensure bearer token
  utils: true,
}
```

For more information about these services, check the document about **Built-in Services**.
