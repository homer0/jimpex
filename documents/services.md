# Built-in Services

All of these controllers are available on the Jimpex package and can be easily required and implemented.

In the case of the services from the modules `api`, `http` and `common`, you can register them when the app starts by using the `defaultService` option (Check the options document for more information).

## API Client

An implementation of the [wootils API Client](https://github.com/homer0/wootils/blob/master/documents/shared/APIClient.md) but that is connected to the HTTP service, to allow logging and forwarding of the headers.

- Module: `api`
- Requires: `http` and `appError`

```js
const {
  Jimpex,
  services: {
    api: { apiClient },
    common: { appError },
    http: { http },
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

By default, the service is registered with the name `apiClient`, the API entry point is taken from the configuration setting `api.url` and the endpoints from `api.endpoints`, but you can use the _"service generator"_ `apiClientCustom` to modify those options:

```js
const {
  Jimpex,
  services: {
    api: { apiClientCustom },
    common: { appError },
    http: { http },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(http);
    this.register(appError);
        
    // Register the client
    this.register({
      'myCustomAPIService',
      'myapi'
    });
  }
}
```

The first parameter is the name used to register the server and the second one is the setting key that has a `url` and an `endpoints` dictionary.

## Ensure bearer authentication

A service-middleware that allows you to validate the incoming requests `Authorization` header.

It's a _"service-middleware"_ because when you access the service, it doesn't return a class instance, but a middleware function for you to use on your controller routes.

- Module: `api`
- Requires: `appError`

```js
const {
  Jimpex,
  services: {
    api: { ensureBearerAuthentication },
    common: { appError },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(appError);
        
    // Register the service
    this.register(apiClient);
  }
}
```

Now, if the token process a request an detects a valid token, it will set that token on the request `bearerToken` property:

```js
const myCtrl = controller((app) => {
  const router = app.get('router');
  const ensureAuthentication = app.get('ensureBearerAuthentication');
  return [router.get('/something', [
    ensureAuthentication,
    (req, res, next) => {
      console.log('Token:', req.bearerToken);
      next();
    },
  ])];
});
```

## Version validator

A service-middleware to validate a `version` parameter against the configuration `version` setting. It's what the version validator middleware internally uses.

It's a _"service-middleware"_ because when you access the service, it doesn't return a class instance, but a middleware function for you to use on your controller routes.

- Module: `api`
- Requires: `responsesBuilder` and `appError`

```js
const {
  Jimpex,
  services: {
    api: { versionValidator },
    common: { appError },
    http: { responsesBuilder },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(appError);
    this.register(responsesBuilder);
        
    // Register the service
    this.register(versionValidator);
  }
}
```

Now you can use it on your controllers routes to validate that the version being used is the same as the one the app is running on:

```js
const myCtrl = controller((app) => {
  const router = app.get('router');
  const versionValidator = app.get('versionValidator');
  return [router.get('/:version/something', [
    versionValidator,
    (req, res, next) => {
      console.log('The version is valid!');
      next();
    },
  ])];
});
```

## Error

A very simple subclass the `Error` to inject extra information on the errors so they can customize the error handler responses.

Something important to remember is that the `appError` service doesn't return an instance of the service but the class so you can construct an error.

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

That's all, now you can do `get('appError')`, inject `AppError` and generate your custom errors:

```js
new Error('Something happened', {
  someProp: 'someValue',
}):
```

This is useful if you are building a app with multiple known exceptions, you can use the extra settings to send context information.

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

The service, after registering, it also hooks itself to the app event that gets fired when it starts so it can create the file automatically.

Now, this service has a few default options, so instead of explaining which are, we'll see each option on detail:

```js
{
  // The name of the file it should use as template.
  template: 'index.tpl.html',

  // The name of the generated file.
  file: 'index.html',

  // Whether or not to delete the tempalte after generating the file.
  deleteTemplateAfter: true,

  // The placeholder string where the information will be written.
  replacePlaceholder: '{{appConfiguration}}',

  // The name of the variable that will have the information on the file.
  variable: 'appConfiguration',

  // A list of settings from the app configuration that will be used as the
  // information to inject on the file.
  configurationKeys: ['features', 'version', 'postMessagesPrefix'],
}
```

It also supports a custom service with a `getValues` method to obtain the information to inject instead of taking it from the configuration.

To modify the options, you need to use the _"service generator"_ `htmlGeneratorCustom`:

```js
const {
  Jimpex,
  services: {
    frontend: { frontendFs },
    html: { htmlGeneratorCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(frontendFs);
    
    // Register the service
    this.register(htmlGeneratorCustom(
      'my-html-generator',
      {
        template: 'template.tpl',
        file: 'my-index.html',
        ...
      }
    ));
  }
}
```

The first parameter is the name of the service and the second the options to customize it. In case you want to use another service to get the values, you can send the name of that service as the third parameter.

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