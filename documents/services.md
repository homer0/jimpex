# 🛠 Built-in Services

All of these services are available on the Jimpex package and can be easily required and implemented.

In the case of the services from the modules `api`, `http` and `common`, you can register them when the app starts by using the `servoces` option (Check the **options document** for more information).

## API Client

An implementation of the [`@homer0/api-utils`](https://npmjs.com/package/@homer0/api-utils), but that is connected to the HTTP service, to allow logging and forwarding of the headers.

- Module: `http`
- Requires: `http` and `httpError`

```ts
import { Jimpex, httpProvider, httpErrorProvider, apiClientProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpProvider);
    this.register(httpErrorProvider);

    // Register the client
    this.register(apiClientProvider);
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
  configSetting: 'api',

  // The class the service will instantiate. This is in case you end up extending the
  // base one in order to add custommethods.
  clientClass: APIClient,
}
```

You can use the provider as a function to modify the options:

```js
import {
  Jimpex,
  httpProvider,
  httpErrorProvider,
  apiClientProvider,
} from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpProvider);
    this.register(httpErrorProvider);

    // Register the client with options
    this.register(apiClientProvider({
      serviceName: 'myCustomAPIService',
      configurationSetting: 'myapi',
    });
  }
}
```

## App Error

A very simple subclass of `Error` but with support for context information. It can be used to customize the error handler responses.

- Module: `common`

```ts
import { Jimpex, appErrorProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(appErrorProvider);
  }
}
```

By registering the "service", two things are added to the container: The class declaration, so you can construct the errors, and a shorthand function that does the same:

```ts
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

## HTTP Error

This subclass from `AppError` just makes it required to specify the HTTP status code. While the idea behind `AppError` is to be used on every handled error in the application, `HTTPError` is only used on errors that involve HTTP requests.

- Module: `common`

```ts
import { Jimpex, httpErrorProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(httpErrorProvider);
  }
}
```

And just like `AppError`, by registering it, you get both the class and the shorthand function:

```ts
const HTTPError = app.get('HTTPError');
throw new HTTPError('Unauthorized', 401, {
  someProp: 'someValue',
});

// or
const httpError = app.get('httpError');
throw httpError('Unauthorized', 401, {
  someProp: 'someValue',
});
```

## Ensure bearer token

A service-middleware that allows you to validate and retrieve a bearer token from the incoming requests' `Authorization` header.

It's a _"service-middleware"_ because when you access the service, it doesn't return a class/service instance, but a middleware function for you to use on your controller routes.

- Module: `utils`
- Requires: `httpError`

```ts
import { Jimpex, httpErrorProvider, ensureBearerTokenProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpErrorProvider);

    // Register the service
    this.register(ensureBearerTokenProvider);
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

You can modify those default values by using the provider as a function when registering:

```ts
import { Jimpex, httpErrorProvider, ensureBearerTokenProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(httpErrorProvider);

    // Register the service
    this.register(
      ensureBearerTokenProvider({
        error: {
          message: 'You are not authorized to access this route',
        },
        local: 'userToken',
      }),
    );
  }
}
```

Now, if the middleware processes a request and detects a valid token, it will save it on `res.locals.token` (or whatever you customized the `local` option to):

```ts
import { controller } from 'jimpex';

export const myCtrl = controller((app) => {
  const router = app.get('router');
  const ensureBearerToken = app.get('ensureBearerToken');
  return router.get('/something', [
    ensureBearerToken,
    (req, res, next) => {
      console.log('Token:', res.locals.token);
      next();
    },
  ]);
});
```

## Send File

It allows you to easily send a file on a response with a path relative to the app executable.

The `sendFile` doesn't return a class service instance but just a function.

- Module: `common`

```ts
import { Jimpex, sendFileProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(sendFileProvider);
  }
}
```

Done, you can now use it on your middlewares and/or controllers routes to send files as responses:

```ts
import { controller } from 'jimpex';

export const myCtrl = controller((app) => {
  const router = app.get('router');
  const sendFile = app.get('sendFile');
  return router.get('/something', [
    (req, res, next) => {
      sendFile({ res, filepath: './something.html', next });
    },
  ]);
});
```

By default, the path of the file is relative to the directory where the app executable is located, but you can change the location ([Check `@homer0/path-utils` locations](https://www.npmjs.com/package/@homer0/path-utils#multiple-locations)) by using the `from` option:

```ts
import { controller } from 'jimpex';

export const myCtrl = controller((app) => {
  const router = app.get('router');
  const sendFile = app.get('sendFile');
  return router.get('/something', [
    (req, res, next) => {
      sendFile({
        res,
        filepath: './something.html',
        next,
        from: 'home',
      });
    },
  ]);
});
```

In this last example, the path to the file is relative to the project root directory (`home`).

## Frontend Fs

This service allows the app to easily work with the filesystem. The idea behind centralizing this functionalities into a service is that is pretty common to have bundling tools to generate the frontend, and on that process files can have different paths or not even be generated all, that's why this service exists.

The service can be extended/overwritten to accommodate any requirements and avoid having to update or add `if`s to every `fs` call the app does. Another _'feature'_ of this service is that all the paths are relative to the directory where the app executable is located, so you don't have to remember the relative path from the place you are accessing a file to the place where it's located.

- Module: `common`

```ts
import { Jimpex, frontendFsProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(frontendFsProvider);
  }
}
```

Now, whenever you are reading/writing/deleting a file that was generated/belongs to the frontend, you can use this service methods:

- `.read(filepath, [encoding='utf-8'])`
- `.write(filepath, data)`
- `.delete(filepath)`

## HTML Generator

A service that allows you to generate an HTML file when the app gets started. The service also gives you an easy way to replace placeholders with settings from the configuration, and even expose a `window` variable with the configuration.

- Module: `html`
- Requires: `frontendFs`

```ts
import { Jimpex, frontendFsProvider, htmlGeneratorProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(frontendFsProvider);

    // Register the service
    this.register(htmlGeneratorProvider);
  }
}
```

The service, after registering, it hooks itself to the app event that gets fired when it starts, so it can create the file automatically.

Now, this service has a few default options, so instead of explaining which are, we'll see each option on detail:

```js
{
  // The name the service will have in the container; in case you need more than one.
  serviceName: 'htmlGenerator',

  // The name of a service from which it could obtain the values for the template.
  // When instantiated, it will look for it on the container, and if is not avaiable,
  // it will just ignore it and use the `configKeys` options.
  valuesServiceName: 'htmlGeneratorValues',

  // The name of the file it should use as template.
  template: 'index.tpl.html',

  // The name of the generated file.
  file: 'index.html',

  // Whether or not to delete the template after generating the file.
  deleteTemplateAfter: true,

  // The placeholder string where the information will be written.
  replacePlaceholder: /\{\{appConfig(?:uration)?\}\}/,

  // A dynamic placeholder to replace single values on the template.
  valuesExpression: /\{\{(.*?)\}\}/ig,

  // The name of the variable that will have the information on the file.
  variable: 'appConfig',

  // A list of settings from the app configuration that will be used as the
  // information to inject on the file.
  configurationKeys: ['features', 'version', 'postMessagesPrefix'],
}
```

To modify the options, you just need to use provider as a function:

```ts
import { Jimpex, frontendFsProvider, htmlGeneratorProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(frontendFsProvider);

    // Register the service
    this.register(
      htmlGeneratorProvider({
        template: 'template.tpl',
        file: 'my-index.html',
        //...
      }),
    );
  }
}
```

## HTTP

A set of utilities to work with HTTP requests and responses.

- Module: `http`

```ts
import { Jimpex, httpProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(http);
  }
}
```

The `http` service has three methods:

- `getIPFromRequest(req)`: It allows you to get the IP address from an app request.
- `getCustomHeadersFromRequest(req)`: It returns a dictionary with all the custom headers a request may have.
- `fetch(url, options)`: Probably the most important as is the one the app uses to make requests to external services. This method supports the same signature as the native `fetch` function, with the addition that you can send a request object as `req` on the options and the method will include the `x-forwarded-for` header with the request IP address (`getIPFromRequest`) and all the request custom headers (`getCustomHeadersFromRequest`).

Also, if you have a configuration setting named `debug.logRequests` with the value of `true`, it will log information of all the outgoing requests and their responses on the console.

## Responses builder

A service that generates JSON and HTML responses.

- Module: `http`

```ts
import { Jimpex, responsesBuilderProvider } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the service
    this.register(responsesBuilderProvider);
  }
}
```

This service has only two methods:

- `json(options)`: To write regular JSON responses.
- `htmlPostMessage(options)`: To write an HTML response that sends a post message. Very useful for when the app executed the route using a popup.
