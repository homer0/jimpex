# Built-in Controllers

All of these controllers are available on the Jimpex package and can be easily required and implemented.

## Version validator

If you mount it on a route it will generate a `409` error if the request doesn't have a version parameter with the same version as the one on the configuration file.

- Module: `api`
- Requires: `versionValidator`

```js
const {
  Jimpex,
  services: {
    api: { versionValidator },
  },
  controllers: {
    api: { versionValidatorController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(versionValidator);
    
    // Add the controller.
    this.mount('/api', versionValidatorController);
  }
}
```

The controller will mount one route:

- `* /:version/*`: To validate and protect any sub route.

You can mount other routes on `/api/:version/...` and they'll be _"protected"_ by the version check.

## Configuration

Allows you to see and switch the current configuration. It can be enabled or disabled by using a setting on the configuration.

- Module: `common`
- Requires: `responsesBuilder`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
  },
  controllers: {
    common: { configurationController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    
    // Add the controller.
    this.mount('/config', configurationController);
  }
}
```

Now, there are two rules behind this controller:

1. Your configuration must have a setting `debug.configurationController` with the value of `true`.
2. To be able to switch configurations, the default configuration and/or the first configuration loaded must have a setting `allowConfigurationSwitch` set to `true`.

The reason for those rules is that this controller is development purposes as you wouldn't want to make public the settings of your app.

The controller then will mount two routes:

- `GET /`: It will show the current configuration.
- `GET /switch/:name`: It will, if allowed, switch to an specified configuration.

## Health

Shows the version and name of the configuration, just to check the app is running.

- Module: `common`
- Requires: `responsesBuilder`

```js
const {
  Jimpex,
  services: {
    http: { responsesBuilder },
  },
  controllers: {
    common: { healthController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(responsesBuilder);
    
    // Add the controller.
    this.mount('/health', healthController);
  }
}
```

That's all there is, the controller mounts only one route:

- `GET /`: Shows the information.

## Root Statics

It allows your app to server static files from the root directory, without having to use the `static` middleware on that directory.

- Module: `common`
- Requires: `sendFile`

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  controllers: {
    common: { rootStaticsController },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the controller.
    this.mount('/', rootStaticsController);
  }
}
```

By default, it serves an `index.html` and a `favicon.ico`, but you can use the _"controller generator"_ `rootStaticsControllerCustom` to modify those values:

```js
const {
  Jimpex,
  services: {
    common: { sendFile },
  },
  controllers: {
    common: { rootStaticsControllerCustom },
  },
};

class App extends Jimpex {
  boot() {
    // Register the dependencies...
    this.register(sendFile);
    
    // Add the controller.
    this.mount('/', rootStaticsControllerCustom([
      'my-file-one.html',
      'favicon.icon',
      'index.html',
      'some-other.html',
    ]));
  }
}
```

The controller mounts a `GET` route for each one of those files.
