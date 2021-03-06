jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/controllers/common/configuration');

const {
  ConfigurationController,
  configurationController,
} = require('../../../src/controllers/common/configuration');

describe('controllers/common:configuration', () => {
  it('should be instantiated an have public methods', () => {
    // Given
    const appConfiguration = 'appConfiguration';
    const responsesBuilder = 'responsesBuilder';
    let sut = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    // Then
    expect(sut).toBeInstanceOf(ConfigurationController);
    expect(typeof sut.getConfigurationResponse).toBe('function');
    expect(typeof sut.showConfiguration).toBe('function');
    expect(typeof sut.switchConfiguration).toBe('function');
  });

  it('should have a generic method to generate a configuration reponse', () => {
    // Given
    const appConfiguration = {
      name: 'my-config',
      config: {
        port: 2509,
        server: 'something',
      },
      get: jest.fn(() => appConfiguration.name),
      getConfig: jest.fn(() => appConfiguration.config),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const response = 'response';
    const expectedData = {
      name: appConfiguration.name,
      ...appConfiguration.config,
    };
    let sut = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    sut.getConfigurationResponse(response);
    // Then
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('name');
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(response, expectedData);
  });

  it('should have a middleware to show the current configuration', () => {
    // Given
    const appConfiguration = {
      name: 'my-config',
      config: {
        port: 2509,
        server: 'something',
      },
      get: jest.fn(() => appConfiguration.name),
      getConfig: jest.fn(() => appConfiguration.config),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const request = 'request';
    const response = 'response';
    const expectedData = {
      name: appConfiguration.name,
      ...appConfiguration.config,
    };
    let sut = null;
    let middleware = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    middleware = sut.showConfiguration();
    middleware(request, response);
    // Then
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('name');
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(response, expectedData);
  });

  it('should have a middleware to switch the current configuration', () => {
    // Given
    const appConfiguration = {
      switchEnabled: true,
      name: 'my-config',
      config: {
        port: 2509,
        server: 'something',
      },
      get: jest.fn(() => appConfiguration.name),
      getConfig: jest.fn(() => appConfiguration.config),
      canSwitch: jest.fn(() => appConfiguration.switchEnabled),
      switch: jest.fn(),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const newConfigurationName = 'new-config';
    const request = {
      params: {
        name: newConfigurationName,
      },
    };
    const response = 'response';
    const next = jest.fn();
    const expectedData = {
      name: appConfiguration.name,
      ...appConfiguration.config,
    };
    let sut = null;
    let middleware = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    middleware = sut.switchConfiguration();
    middleware(request, response, next);
    // Then
    expect(appConfiguration.canSwitch).toHaveBeenCalledTimes(1);
    expect(appConfiguration.switch).toHaveBeenCalledTimes(1);
    expect(appConfiguration.switch).toHaveBeenCalledWith(newConfigurationName);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('name');
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(response, expectedData);
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("shouldn't switch configurations if the appConfiguration service doesn't allow it", () => {
    // Given
    const appConfiguration = {
      switchEnabled: false,
      get: jest.fn(),
      canSwitch: jest.fn(() => appConfiguration.switchEnabled),
      switch: jest.fn(),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const request = 'request';
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    middleware = sut.switchConfiguration();
    middleware(request, response, next);
    // Then
    expect(appConfiguration.canSwitch).toHaveBeenCalledTimes(1);
    expect(appConfiguration.switch).toHaveBeenCalledTimes(0);
    expect(appConfiguration.get).toHaveBeenCalledTimes(0);
    expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should send the error to the next middleware if switching configurations fails', () => {
    // Given
    const error = new Error('Unknown error');
    const appConfiguration = {
      switchEnabled: true,
      get: jest.fn(),
      canSwitch: jest.fn(() => appConfiguration.switchEnabled),
      switch: jest.fn(() => {
        throw error;
      }),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const newConfigurationName = 'new-config';
    const request = {
      params: {
        name: newConfigurationName,
      },
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new ConfigurationController(appConfiguration, responsesBuilder);
    middleware = sut.switchConfiguration();
    middleware(request, response, next);
    // Then
    expect(appConfiguration.canSwitch).toHaveBeenCalledTimes(1);
    expect(appConfiguration.switch).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledTimes(0);
    expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('should return its routes when the debug `configurationController` flag is `true`', () => {
    // Given
    const appConfiguration = {
      'debug.configurationController': true,
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const services = {
      appConfiguration,
      router: {
        get: jest.fn((route, middleware) => [`get:${route}`, middleware.toString()]),
      },
    };
    const app = {
      get: jest.fn((service) => services[service] || service),
    };
    let routes = null;
    let toCompare = null;
    const expectedGets = ['appConfiguration', 'router', 'responsesBuilder'];
    // When
    routes = configurationController.connect(app);
    toCompare = new ConfigurationController('appConfiguration', 'responsesBuilder');
    // Then
    expect(routes).toEqual([
      ['get:/', toCompare.showConfiguration().toString()],
      ['get:/switch/:name', toCompare.switchConfiguration().toString()],
    ]);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });

  it("shouldn't return its routes when the debug `configurationController` flag is `false`", () => {
    // Given
    const appConfiguration = {
      'debug.configurationController': false,
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const services = {
      appConfiguration,
      router: {
        get: jest.fn(),
      },
    };
    const app = {
      get: jest.fn((service) => services[service] || service),
    };
    let routes = null;
    const expectedGets = ['appConfiguration'];
    // When
    routes = configurationController.connect(app);
    // Then
    expect(routes).toEqual([]);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
