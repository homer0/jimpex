# Built-in Middlewares

All of these controllers are available on the Jimpex package and can be easily required and implemented.

## Error Handler

Allows you to generate responses for errors and potentially hide uncaught exceptions under a generic message, unless it's disabled via configuration settings.

- Module: `common`
- Requires: `responsesBuilder` and `appError`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
    common: { appError },
  },
  middlewares: {
    common: { errorHandler },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    this.register(appError);
    
    ...
    
    // Add the middleware at the end.
    this.use(errorHandler);
  }
}
```

Now, there's a configuration setting for this controller: `debug.showErrors`. By enabling the setting, the middleware will show the message and the stack information of all kind of errors.

If the configuration setting is disabled (or not present), the errors stack will never be visible, and if the error is not an instance of `AppError`, it will show a generic message.

By default, the generic message is _"Oops! Something went wrong, please try again"_ and the default HTTP status is `500`, but you can use it as a function to modify those defaults:

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
    common: { appError },
  },
  middlewares: {
    common: { errorHandler },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    this.register(appError);
    
    ...
    
    // Add the middleware at the end.
    this.use(errorHandler({
      default: {
        message: 'Unknown error',
        status: 503,
      },
    }));
  }
}
```

Finally, when using errors of the type `AppError`, you can add the following context information:

```js
// Assuming `AppError` is the injected `AppError` and you are on the context of a middleware
next(new AppError('Something went wrong', {
  status: someHTTPStatus,
  response: someObject,
}));
```

- `status` will replace the error responses HTTP status.
- `response` will be merged into the error response `data` key.

## Force HTTPS

Redirect all incoming traffic from HTTP to HTTPS. It also allows you to set routes to ignore the redirection.

- Module: `common`

```js
const {
  Jimpex,
  middlewares: {
    common: { forceHTTPS },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(errorHandler);
  }
}
```

By default, it redirects all the URLs that don't start with `/service/` from HTTP to HTTPs, but you can use it as a function to modify the rules:

```js
const {
  Jimpex,
  middlewares: {
    common: { forceHTTPS },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(forceHTTPS([
      /^\/service\//,
      /^\/api\//,
    ]));
  }
}
```

**VERY IMPORTANT:** The forced redirection will only happen if your configuration has a setting named `forceHTTPS` with a value of `true`.

## Fast HTML

Allows your app to skip unnecessary processing by showing an specific HTML when a requested route doesn't have a controller for it or is not on a "whitelist"

- Module: `html`
- Requires: `events`, `sendFile` and, optionally, an `HTMLGenerator` service.

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { fastHTML },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware on one of the first positions.
    this.use(fastHTML);
  }
}
```

The middleware has a few options with default values that can be customized:

```js
{
  // The name of the file it will serve.
  file: 'index.html',
  // A list of expressions for routes that should be ignored.
  ignore: [/\.ico$/i],
  // Whether or not to use the routes controlled by the app to validate the requests.
  useAppRoutes: true,
  // The name of the HTML Generator service the middleware can use to obtain the HTML. 
  htmlGenerator: 'htmlGenerator',
}
```

You can customize all those options by just calling the middleware as a function:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { fastHTML },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware on one of the first positions.
    this.use(fastHTML({
      file: 'my-custom-index.html',
      ignore: [`/^\/service\//`],
      useAppRoutes: false,
      htmlGenerator: null, // To disable it.
    }));
  }
}
```

Now, as mentioned on the requirements, you can optionally use the `htmlGenerator` service or an `HTMLGenerator`-like service to serve a generated file.

You use the `htmlGenerator` option to disable it, or modify the name of the service it will look for:

- If you set it to a _"falsy"_ value, it will be disabled.
- If you change its name, it will try to look for that service when mounted.

**Important:** When using the generator, no matter the value you set on the `file` option, it will overwritten with the name of the file from the generator service.

## Show HTML

A really simple middleware to serve an HTML file. Its true feature is that it can be hooked up to the **HTML Generator** service.

- Module: `html`
- Requires: `sendFile` and, optionally, an `HTMLGenerator` service.

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { showHTML },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware at the end.
    this.use(showHTML);
  }
}
```

By default, if the middleware is reached, it will show an `index.html`, but you can use it as a function to modify the filename:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { showHTML },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware at the end.
    this.use(showHTML({
      file: 'my-file.html',
    }));
  }
}
```

Now, as mentioned on the requirements, you can optionally use the `htmlGenerator` or an `HTMLGenerator` service to show the generated file.

The default implementation checks if there's an `htmlGenerator` service registered on the app and uses that file; and in the case of `showHTML`, you can specify a second parameter with the name of the `HTMLGenerator` service name you want to use.

## Version validator

This can be used as a middleware and as controller. The idea is that it validates a `version` parameter against the version defined on the configuration.

- Module: `utils`
- Requires: `appConfiguration`, `responsesBuilder` and `appError`

```js
const {
  Jimpex,
  middlewares: {
    utils: { versionValidator },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware before the routes you want to be protected.
    this.use(versionValidator);
    // or, protect a specific route.
    this.mount('/to-protect', versionValidator);
  }
}
```

By default, it comes with a lot of already defined options, like whether or not to allow `latest` as a version, but you can use it as a function to modify them, for example:

```js
const {
  Jimpex,
  middlewares: {
    utils: { versionValidator },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware before the routes you want to be protected.
    this.use(versionValidator({
      latest: {
        allow: false,
      }
    }));
    // or, protect a specific route.
    this.mount('/to-protect', versionValidator({
      latest: {
        allow: false,
      }
    }));
  }
}
```

**Very important:** The middleware will only validate if `req.params.version` is found.
