# ⚙️ Jimpex Options

The options allow you to customize the functionality of Jimpex, and of the Express application that runs under the hood.

As mentioned in the `README`, the options are not the same as the "configuration", since the configuration stores settings that are more related to the runtime execution and the environment (like the port), while the options aim to customize the capabilities of the application (like removing the `X-Powered-By` header).

- [Overview](#overview)
- [.path](#path)
- [.config](#config)
- [.statics](#statics)
- [.express](#express)
- [.services](#services)

## Overview

Now, this is what the options object looks like:

> The ones with sub objects will be explained below the snippet.

```js

  // The size limit for the requests payload.
  filesizeLimit: '15MB',

  // Whether or not to call the `boot` method after initialization.
  boot: true,

  // A function to validate the health status of the application.
  healthCheck: () => Promise.resolve(true),

  // The options to configure the application executable path.
  path: {...},

  // The options to customize how the configuration is loaded.
  config: {...},

  // The options for the static middleware.
  statics: {...},

  // The options to customize the express instance and default middlewares.
  express: {...},

  // Which built-in services to register.
  services: {...},
}
```

## .path

The options to configure the application executable path.

The reason for these options is that with CJS, finding the top module wasn't very complicated, but with ESM, is not so easy, and the recommended approach no always yields the correct result.

```js
{
  // A "hardcoded" path to the application executable file.
  appPath: '',

  // If `true`, it will try to figure out the parent file path, and use its directory
  // as the path.
  useParentPath: true,
}
```

## .config

This set of options allows you to customize every aspect of how the configuration service is created. Remember that the app requires a valid configuration with a `port` setting to be started:

```js
{
  // The default config. It can be used to avoid relying on an external file.
  default: {},

  // The name of the app, to be used on the configs directory and filenames.
  name: 'app',

  // The path relative to the root directory where the configs are located.
  path: 'config/',

  // If `true`, the path to the config will add a folder with the name of the app.
  // `true` -> `config/app/...`, `false` -> `config/...`
  hasFolder: false,

  // The environment variable the app will check for a config name.
  environmentVariable: 'CONFIG',

  // Whether or not to check for the environment variable.
  loadFromEnvironment: true,

  // The name format of the default config, loaded if it exists.
  defaultConfigFilename: '[app-name].config.js',

  // The name format of the alternative config files.
  filenameFormat: '[app-name].[config-name].config.js',
}
```

As you can see, if you don't want to depend on environment variables or just have one single configuration for your app, you can use the `default` option.

The configuration service is an implementation of [`@homer0/simple-config`](https://npmjs.com/package/@homer0/simple-config).

## .statics

These options are specifically for the Express [`static`](https://github.com/expressjs/serve-static) middleware:

```js
{
  // Whether or not to enable the middleware to serve statics files.
  enabled: true,

  // If `true`, the statics folder would be relative to the project root directory, otherwise,
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

## .express

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

## .services

These options allow you to register some of the built-in service that I consider useful enough to be added on any app.

```js
{
  // These services include:
  // - App Error
  // - HTTP Error
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
