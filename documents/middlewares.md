# ⚡️ Built-in Middlewares

All of these middlewares are available on the Jimpex package and can be easily required and implemented.

- [Error handler](#error-handler)
- [Force HTTPS](#force-https)
- [HSTS](#hsts)
- [Fast HTML](#fast-html)
- [Show HTML](#show-html)
- [Version validator](#version-validator)

## Error handler

Allows you to generate responses for errors and potentially hide uncaught exceptions under a generic message, unless it's disabled via configuration settings.

- Module: `common`
- Requires: `responsesBuilder` and `appError`

```ts
import {
  Jimpex,
  responsesBuilderProvider,
  appErrorProvider,
  errorHandlerMiddleware,
} from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilderProvider);
    this.register(appErrorProvider);

    // ... after mounting the routes.

    // Add the middleware at the end.
    this.use(errorHandlerMiddleware);
  }
}
```

Now, there's a configuration setting for this controller: `debug.showErrors`. By enabling the setting, the middleware will show the message and the stack information of all kind of errors.

If the configuration setting is disabled (or not present), the stacks will never be visible, and if the error is not an instance of `AppError` (or `HTTPError`), it will show a generic message.

By default, the generic message is _"Oops! Something went wrong, please try again"_ and the default HTTP status is `500`, but you can use it as a function to modify those defaults:

```ts
import {
  Jimpex,
  responsesBuilderProvider,
  appErrorProvider,
  errorHandlerMiddleware,
} from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilderProvider);
    this.register(appErrorProvider);

    // ... after mounting the routes.

    // Add the middleware at the end.
    this.use(
      errorHandlerMiddleware({
        response: {
          message: 'Unknown error',
          status: 503,
        },
      }),
    );
  }
}
```

Finally, when using errors of the type `AppError`, you can add the following context information:

```ts
// Assuming `AppError` is the injected `AppError` and you are on the context of a
// middleware
next(
  new AppError('Something went wrong', {
    status: someHTTPStatus,
    response: someObject,
  }),
);
```

- `status` will replace the error response HTTP status.
- `response` will be merged into the error response `data` key.

## Force HTTPS

Redirect all incoming traffic from HTTP to HTTPS. It also allows you to set routes to ignore the redirection.

- Module: `common`

```ts
import { Jimpex, forceHTTPSMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(forceHTTPSMiddleware);
  }
}
```

**⚠️ VERY IMPORTANT:** The middleware will only work if your configuration has a setting named `forceHTTPS` with a value of `true`.

By default, it redirects all the URLs that **don't** start with `/service/` from HTTP to HTTPs, but you can use it as a function to modify the rules:

```ts
import { Jimpex, forceHTTPSMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(
      forceHTTPSMiddleware({
        ignoredRoutes: [/^\/service\//, /^\/api\//],
      }),
    );
  }
}
```

## HSTS

It configures a `Strict-Transport-Security` header and includes it on every response.

- Module: `common`

```ts
import { Jimpex, hstsMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(hstsMiddleware);
  }
}
```

**⚠️ VERY IMPORTANT:** The middleware will only work if your configuration has a setting named `hsts.enabled` with a value of `true`.

You can also use it as a function and send the following options:

- `maxAge`: The time, in seconds, that the browser should remember that a site is only to be accessed using HTTPS. The default value is `31536000` (one year).
- `includeSubDomains`: Whether or not the rule should apply to all sub domains. The default value is `true`.
- `preload`: Whether or not to include on the major browsers' preload list. This directive is not part of the specification, for more information about it, you should check the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) for the header. The default value is `false`.

```ts
import { Jimpex, hstsMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware first.
    this.use(
      hstsMiddleware({
        maxAge: 5,
        includeSubDomains: false,
      }),
    );
  }
}
```

If you don't send options, before using the defaults, it will first try to obtain them for a `hsts` key on the configuration, so you can also manage how the feature works from there.

## Fast HTML

Allows your app to skip unnecessary processing by showing an specific HTML when a requested route doesn't have a controller for it or is not on a "whitelist"

- Module: `html`
- Requires: `events`, `sendFile` and, optionally, an `HTMLGenerator` service.

```ts
import { Jimpex, sendFileProvider, fastHTMLMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the middleware on one of the first positions.
    this.use(fastHTMLMiddleware);
  }
}
```

The middleware has a few options with default values that can be customized:

```ts
{
  // The name of the file it will serve.
  file: 'index.html',
  // A list of expressions for routes that should be ignored.
  ignoredRoutes: [/\.ico$/i],
  // Whether or not to use the routes controlled by the app to validate the requests.
  useAppRoutes: true,
  // The name of the HTML Generator service the middleware can use to obtain the HTML.
  htmlGeneratorServiceName: 'htmlGenerator',
}
```

You can customize all those options by just calling the middleware as a function:

```ts
import { Jimpex, sendFileProvider, fastHTMLMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the middleware on one of the first positions.
    this.use(
      fastHTMLMiddleware({
        file: 'my-custom-index.html',
        ignoredRoutes: [`/^\/service\//`],
        useAppRoutes: false,
        htmlGenerator: '', // To disable it.
      }),
    );
  }
}
```

Now, as mentioned on the requirements, you can optionally use the `htmlGenerator` service or an `HTMLGenerator`-like service to serve a generated file.

You use the `htmlGeneratorServiceName` option to disable it, or modify the name of the service it will look for:

- If you set it to an empty string, it will be disabled.
- If you change its name, it will try to look for that service when mounted, but not fail if it doesn't exist.

**Important:** When using the generator, no matter the value you set on the `file` option, it will overwritten with the name of the file from the generator service.

## Show HTML

A really simple middleware to serve an HTML file. Its true feature is that it can be hooked up to the **HTML Generator** service.

- Module: `html`
- Requires: `sendFile` and, optionally, an `HTMLGenerator` service.

```ts
import { Jimpex, sendFileProvider, showHTMLMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the middleware at the end.
    this.use(showHTMLMiddleware);
  }
}
```

By default, if the middleware is reached, it will show an `index.html`, but you can use it as a function to modify the filename:

```ts
import { Jimpex, sendFileProvider, showHTMLMiddleware } from 'jimpex';

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFileProvider);

    // Add the middleware at the end.
    this.use(
      showHTMLMiddleware({
        file: 'my-file.html',
      }),
    );
  }
}
```

Just like `fastHTML`, you have a `htmlGeneratorServiceName` to specify the name of an `HTMLGenerator`(-like) service.

## Version validator

This can be used as a middleware and as controller. The idea is that it validates a `version` parameter against a version defined on the configuration.

- Module: `utils`
- Requires: `appConfiguration`, `responsesBuilder` and `appError`

```ts
import { Jimpex, versionValidatorMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware before the routes you want to be protected.
    this.use(versionValidatorMiddleware);
    // or, protect a specific route.
    this.mount('/to-protect', versionValidatorMiddleware);
  }
}
```

By default, it comes with a lot of already defined options, like whether or not to allow `latest` as a version, but you can use it as a function to modify them, for example:

```ts
import { Jimpex, versionValidatorMiddleware } from 'jimpex';

export class App extends Jimpex {
  boot() {
    // Add the middleware before the routes you want to be protected.
    this.use(
      versionValidator({
        latest: {
          allow: false,
        },
      }),
    );
    // or, protect a specific route.
    this.mount(
      '/to-protect',
      versionValidator({
        latest: {
          allow: false,
        },
      }),
    );
  }
}
```

**Very important:** The middleware will only validate if `req.params.version` is found.
