# Built-in Services

All of these controllers are available on the Jimpex package and can be easily required and implemented.

In the case of the services from the modules `api`, `http` and `common`, you can register them when the app starts by using the `defaultService` option (Check the options document for more information).

## API Client

An implementation of the [wootils API Client](https://github.com/homer0/wootils/blob/master/documents/shared/APIClient.md) but that is connected to the HTTP service, to allow logging and forwarding of the headers.

- Module: `http`
- Requires: `http` and `appError`

```js
const {
  Jimpex,
  services: {
    common: { appError },
    http: { apiClient, http },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(http);
    this.register(appError);

    // Register the client
    this.register(apiClient);
  }
}
```

The service has a few options that can be customized:

```js
{
  // The name the service will have in the container; in case you need more than one.
  serviceName: 'apiClient',

  // The name of the configuration setting that will contain the API `url` and `endpoints`.
  // If this is not customized, but the `serviceName` is, this value will be set to the
  // same as the `serviceName`.
  configurationSetting: 'api',

  // The class the service will instantiate. This is in case you end up extending the
  // base one in order to add custommethods.
  clientClass: APIClient,
}
```

You can use the provider as a function to modify the options:

```js
const {
  Jimpex,
  services: {
    common: { appError },
    http: { apiClient, http },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(http);
    this.register(appError);

    // Register the client
    this.register(apiClient({
      serviceName: 'myCustomAPIService',
      configurationSetting: 'myapi',
    });
  }
}
```

## App Error

A very simple subclass of `Error` but with support for context information. It can be used to customize the error handler responses.

- Module: `common`

```js
const {
  Jimpex,
  services: {
    common: { appError },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(appError);
  }
}
```

By registering the "service", two things are added to the container: The class declaration, so you can construct the errors, and a shorthand function that does the same:

```js
const AppError = app.get('AppError');
throw new AppError('Something happened', {
  someProp: 'someValue',
});
// or
const appError = app.get('appError');
throw appError('Something happened', {
  someProp: 'someValue',
});
```

This is useful if you are building an app with multiple known exceptions, you can use the context to send useful information.

## Ensure bearer token

A service-middleware that allows you to validate and retrieve a bearer token from the incoming requests `Authorization` header.

It's a _"service-middleware"_ because when you access the service, it doesn't return a class/service instance, but a middleware function for you to use on your controller routes.

- Module: `utils`
- Requires: `appError`

```js
const {
  Jimpex,
  services: {
    common: { appError },
    utils: { ensureBearerToken },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(appError);

    // Register the service
    this.register(ensureBearerToken);
  }
}
```

This service has a few default options:

```js
{
  // The information for the error generated when no token is found.
  error: {
    // The error message.
    message: 'Unauthorized',
    // The HTTP status associated to the error, this is for the error handler.
    status: 401,
    // Extra context information for the error handler to add to the response.
    response: {},
  },
  // The regular expression used to validate and extract the token.
  expression: /bearer (.*?)(?:$|\s)/i,
  // The name of the property on `res.locals` where the token will be saved.
  local: 'token',
}
```

You modify those default values by using the provider as a function when registering:

```js
const {
  Jimpex,
  services: {
    common: { appError },
    utils: { ensureBearerToken },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(appError);

    // Register the service
    this.register(ensureBearerToken({
      error: {
        message: 'You are not authorized to access this route',
      },
      local: 'userToken',
    }));
  }
}
```

Now, if the token processes a request and detects a valid token, it will save it on `res.locals.token`:

```js
const myCtrl = controller((app) => {
  const router = app.get('router');
  const ensureBearerToken = app.get('ensureBearerToken');
  return [router.get('/something', [
    ensureBearerToken,
    (req, res, next) => {
      console.log('Token:', res.locals.token);
      next();
    },
  ])];
});
```

## HTTP Error

Another type of error, but specific for the HTTP requests the app does with the API client. This is a subclass of `AppError`. The only advantage over `AppError` is that you know the that the type of error is specific to requests and that it has a paramter for an HTTP status.

- Module: `common`

```js
const {
  Jimpex,
  services: {
    common: { httpError },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(httpError);
  }
}
```

By registering the "service", two things are added to the container: The class declaration, so you can construct the errors, and a shorthand function that does the same:

```js
const HTTPError = app.get('HTTPError');
throw new AppError('Not found', 404);
// or
const httpError = app.get('httpError');
throw httpError('Not found', 404);
```
## Send File

It allows you to send a file on a response with a path relative to the app executable.

The `sendFile` doesn't return a class service instance but just a function.

- Module: `common`

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(sendFile);
  }
}
```

Done, you can now use it on your middlewares and/or controllers routes to send files as responses:

```js
const myCtrl = controller((app) => {
  const router = app.get('router');
  const sendFile = app.get('sendFile');
  return [router.get('/something', [
    (req, res, next) => {
      sendFile(res, './something.html', next);
    },
  ])];
});
```

By default, the path of the file is relative to the directory where the app executable is located, but you can change the location ([Check `PathUtils` locations](https://github.com/homer0/wootils/blob/master/documents/node/pathUtils.md#multiple-locations)) by adding an extra parameter:

```js
const myCtrl = controller((app) => {
  const router = app.get('router');
  const sendFile = app.get('sendFile');
  return [router.get('/something', [
    (req, res, next) => {
      sendFile(res, './something.html', next, 'home');
    },
  ])];
});
```

In this last example, the path to the file is relative to the project root directory.

## Frontend Fs

This service allows the app to easily read static files. The idea behind centralizing this functionalities into a service is that is pretty common to have bundling tools to generate the frontend, and on that process files can have different paths or not even be generated all, that's why this service exists.

 The service can be extended/overwritten to accommodate any requirements and avoid having to update or add `if`s to every `fs` call the app does. Another _'feature'_ of this service is that all the paths are relative to the directory where the app executable is located, so you don't have to remember the relative path from the place you are accessing a file to the place where it's located.

- Module: `common`

```js
const {
  Jimpex,
  services: {
    frontend: { frontendFs },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(frontendFs);
  }
}
```

Now, whenever you are reading/writing/deleting a file that was generated/belongs to the frontend, you can use this service methods:

- `.read(filepath, [encoding='utf-8'])`
- `.write(filepath, data)`
- `.delete(filepath)`

## HTML Generator

A service that allows you to generate an HTML file when the app gets started and inject contents of the configuration as a `window` variable.

- Module: `html`
- Requires: `frontendFs`

```js
const {
  Jimpex,
  services: {
    frontend: { frontendFs },
    html: { htmlGenerator },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(frontendFs);

    // Register the service
    this.register(htmlGenerator);
  }
}
```

The service, after registering, it hooks itself to the app event that gets fired when it starts, so it can create the file automatically.

Now, this service has a few default options, so instead of explaining which are, we'll see each option on detail:

```js
{
  // The name the service will have in the container; in case you need more than one.
  serviceName: 'htmlGenerator',

  // The name of a service from will it obtain the values for the template. When
  // instantiated, it will look for it on the container, and if is not avaiable,
  // it will just ignore it and use `configurationKeys`.
  // You can completely by setting the value to `null`.
  valuesService: 'htmlGeneratorValues',

  // The name of the file it should use as template.
  template: 'index.tpl.html',

  // The name of the generated file.
  file: 'index.html',

  // Whether or not to delete the template after generating the file.
  deleteTemplateAfter: true,

  // The placeholder string where the information will be written.
  replacePlaceholder: '{{appConfiguration}}',

  // A dynamic placeholder to replace single values on the template.
  valuesExpression: /\{\{(.*?)\}\}/ig,

  // The name of the variable that will have the information on the file.
  variable: 'appConfiguration',

  // A list of settings from the app configuration that will be used as the
  // information to inject on the file.
  configurationKeys: ['features', 'version', 'postMessagesPrefix'],
}
```

To modify the options, you just need to use provider as a function:

```js
const {
  Jimpex,
  services: {
    frontend: { frontendFs },
    html: { htmlGenerator },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(frontendFs);

    // Register the service
    this.register(htmlGenerator({
      template: 'template.tpl',
      file: 'my-index.html',
      ...
    }));
  }
}
```

## HTTP

A set of utilities to work with HTTP requests and responses.

- Module: `http`

```js
const {
  Jimpex,
  services: {
    http: { http },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(http);
  }
}
```

The `http` service has three methods:

- `getIPFromRequest(req)`: It allows you to get the IP address from an app request.
- `getCustomHeadersFromRequest(req)`: It returns a dictionary with all the custom headers a request may have, except for `x-forwarded-for`.
- `fetch(url, options)`: Probably the most important as is the one the app uses to make requests to external services. This service supports the same signature as the native `fetch` function, with the addition that you can send a request object as `req` on the options and the method will include the `x-forwarded-for` method with the request IP address (`getIPFromRequest`) and all the request custom headers (`getCustomHeadersFromRequest`).

Also, if you have a configuration setting named `debug.logRequests` with the value of `true`, it will log information of all the outgoing requests and their responses on the console.

## Responses builder

A service that generates JSON and HTML responses.

- Module: `http`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
  },
};

class App extends Jimpex {
  boot() {
    // Register the service
    this.register(responsesBuilder);
  }
}
```

This service has only two methods:

- `json(res, data, status = 200, metadata = {})`: To write regular JSON responses.
- `htmlPostMessage(res, title, message, status = 200, options = {})`: To write an HTML response that sends a post message. Very useful for when the app opened the route using a popup. The last parameter allows you to customize the HTML response:

```js
{
  // The target that will emit the `postMessage`.
  target: 'window.opener',

  //  Whether or not to do a `window.close` after sending the message.
  close: true,

  // How many ms should it wait before closing the window, if `options.close` is `true`.
  closeDelay: 700,
}
```
