# Migration to Jimpex V8

Jimpex v8 is a complete rewrite from scratch, since it was migrated to TypeScript, and I took the opportunity to change a few things that I didn't like from the previous version.

## Global changes

### Configuration vs config, and appConfiguration

Wherever an option was called `configuration`, it was renamed to `config`, as well as the configuration service, previously called `appConfiguration`, is now called `config`.

This change was made because most developers would write `config` over `configuration` and I believe it would be more consistent if they wouldn't have to remember that some things are called `config` and others `configuration`.

### Config loaded on start

Another big change to the `config` service, is that, previously, it used to be ready from the moment you instantiated the application, but now it will only be ready once the application is started.

The reason for this change is that the config files are now loaded using ESM `import`, which is async, so it can't be done in the constructor.

When you call `start` or `listen`, the config files will be loaded and the service will be available.

### Options objects vs parameters

When a function has more than two parameters, writing implementations gets "wordy", and it's easy to forget which parameter is which; plus, when you have multiple optional parameters, it becomes a mess if you want you want to use some of them but not all.

To make things easier, almost all the functions/methods with more than 2 parameters were changed to receive an object with the parameters as properties.

For example, the `sendFile` service function used to look like this:

```ts
(res, filepath, next = () => {}, from = 'app') => {
  // ...
};
```

If you wanted to change the last parameter, you would have to overwrite the `next` parameter, which is not ideal if you didn't actually had a reason for it.

Now it looks like this:

```ts
({ res, filepath, from = 'app', next = () => {} }) => {
  // ...
};
```

Same parameters, but as an object.

### Inject option

This is kind of tied to the change to a single object as parameter: **every class/function** that needed to receive a service as a parameter, now has an `inject` option, to have the dependency injection more organized.

For example, the `FastHTML` service constructor used to look like this:

```ts
constructor(events, sendFile, options = {}, htmlGenerator = null) {
  // ...
}
```

With a quick look, it's hard to get which are the injections and which aren't. Now, it has a single parameter, and it looks something like this:

```ts
{
  inject: {
    events,
    sendFile,
    htmlGenerator = null,
  },
  ...options,
}
```

The `inject` property is where all the injections are, and the rest of the properties are the options.

### Sufixes

All services providers now have the `Provider` suffix, and middlewares `Middleware`. For example:

- `htmlGenerator` -> `htmlGeneratorProvider`.
- `fastHTML` -> `fastHTMLMiddleware`.

Controllers already had the `Controller` suffix, so they were not changed.

## Services

### SendFile

- The initializer function now receives an object with the `inject` option.
- The service function now receives a single object with all the parameters.

### FrontendFs

- The class constructor now receives an object with the `inject` option.

### HTMLGenerator

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `variableName` option default value is now `appConfig`.
- The `valuesService` provider option was changed to `valuesServiceName`.

### APIClient

- The class now extends from [`@homer0/api-utils`](http://npmjs.com/package/@homer0/api-utils)'s `APIClient` class, which is a migration of [`wooltils`](http://npmjs.com/package/wootils)' `APIClient`.
- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `configurationSetting` provider option was changed to `configSetting`.
- The `fetch` method now has the `url` as a separated parameter, from the `options` object, in order to have the same signature is the native `fetch`.

### HTTP

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.

### ResponsesBuilder

- The class constructor now receives an object with the `inject` option.
- Both `json` and `htmlPostMessage` now receive a single object with all the options.

### EnsureBearerToken

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `middleware` method was renamed to `getMiddleware`.

## Middlewares

### ErrorHandler

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `showError` setting is now part of the `options`.
- The `default` setting was renamed to `response`.
- The `middleware` method was renamed to `getMiddleware`.

### ForceHTTPS

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `middleware` method was renamed to `getMiddleware`.

### HSTS

- The `middleware` method was renamed to `getMiddleware`.

### FastHTML and ShowHTML

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The "attempt" to get the `htmlGenerator` service is now injected as a function, so it can be called when the middleware is actually used, thus, avoid "breaking" the lazy load of the service (and its dependencies).
- The `middleware` method was renamed to `getMiddleware`.

### VersionValidator

- The class constructor now has a single parameter that merges the previous `options` and all the injections. The injections are all inside an `inject` property.
- The `middleware` method was renamed to `getMiddleware`.
