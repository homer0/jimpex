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

If the configuration setting is disabled (or not present), the errors stack will never be visible, and if the error is not an instance of the `AppError` service, it will show a generic message.

By default, the generic message is _"Oops! Something went wrong, please try again"_ and the default HTTP status is `500`, but you can use the _"middleware generator"_ `errorHandlerCustom` to modify those defaults:

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
    common: { appError },
  },
  middlewares: {
    common: { errorHandlerCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    this.register(appError);
    
    ...
    
    // Add the middleware at the end.
    this.use(errorHandlerCustom({
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

By default, it redirects all the URLs that don't start with `/service/` from HTTP to HTTPs, but you can use the _"middleware generator"_ `forceHTTPSCustom` to modify the rules:

```js
const {
  Jimpex,
  middlewares: {
    common: { forceHTTPSCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(forceHTTPSCustom([
      /^\/service\//,
      /^\/api\//,
    ]));
  }
}
```

**VERY IMPORTANT:** The forced redirection will only happen if your configuration has a setting named `forceHTTPS` with a value of `true`.

## Fast HTML

Allows you to specify which routes will be handled and in case there are no controllers for a requested route, it sends out and HTML file, thus preventing the request to be unnecessarily processed by the middlewares.

- Module: `html`
- Requires: `sendFile` and, optionally, an `HTMLGenerator` service.

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

By default, if the requested URL doesn't match `/^\/api\//` or `/\.ico$/` it serves an `index.html`, but you can use the _"middleware generator"_ `fastHTMLCustom` to modify those options:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { fastHTMLCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware on one of the first positions.
    this.use(fastHTMLCustom(
      'my-custom-index.html',
      [`/^\/service\//`]
    ));
  }
}
```

Now, as mentioned on the requirements, you can optionally use the `htmlGenerator` or an `HTMLGenerator` service to serve a generated file.

The default implementation checks if there's an `htmlGenerator` service registered on the app and uses that file; and in the case of `fastHTMLCustom`, you can specify a third parameter with the name of the `HTMLGenerator` service name you want to use.

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

By default, if the middleware is reached, it will show an `index.html`, but you can use the _"middleware generator"_ `showHTMLCustom` to modify the filename:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  middlewares: {
    html: { showHTMLCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the middleware at the end.
    this.use(showHTMLCustom('my-file.html'));
  }
}
```

Now, as mentioned on the requirements, you can optionally use the `htmlGenerator` or an `HTMLGenerator` service to show the generated file.

The default implementation checks if there's an `htmlGenerator` service registered on the app and uses that file; and in the case of `showHTMLCustom `, you can specify a second parameter with the name of the `HTMLGenerator` service name you want to use.

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

By default, it comes with a lot of already defined options, like whether or not to allow `latest` as a version, but you can use the _"middleware generator"_ `versionValidatorCustom` to modify them, for example:

```js
const {
  Jimpex,
  middlewares: {
    utils: { versionValidatorCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Add the middleware before the routes you want to be protected.
    this.use(versionValidatorCustom({
      latest: {
        allow: false,
      }
    }));
    // or, protect a specific route.
    this.mount('/to-protect', versionValidatorCustom({
      latest: {
        allow: false,
      }
    }));
  }
}
```

**Very important:** The middleware will only validate if `req.params.version` is found.
