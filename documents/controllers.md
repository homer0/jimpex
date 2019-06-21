# Built-in Controllers

All of these controllers are available on the Jimpex package and can be easily required and implemented.

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

By default, it serves an `index.html` and a `favicon.ico`, but you can use it as a function to modify those values:

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
    this.mount('/', rootStaticsController([
      'my-file-one.html',
      'favicon.icon',
      'index.html',
      'some-other.html',
    ]));
  }
}
```

The controller mounts a `GET` route for each one of those files.
