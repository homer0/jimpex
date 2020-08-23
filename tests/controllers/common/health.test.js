jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/controllers/common/health');

require('jasmine-expect');
const { code: statuses } = require('statuses');
const {
  HealthController,
  healthController,
} = require('../../../src/controllers/common/health');

describe('controllers/common:health', () => {
  it('should be instantiated and have a public method', () => {
    // Given
    const appConfiguration = 'appConfiguration';
    const responsesBuilder = 'responsesBuilder';
    let sut = null;
    // When
    sut = new HealthController(appConfiguration, responsesBuilder);
    // Then
    expect(sut).toBeInstanceOf(HealthController);
    expect(sut.health).toBeFunction();
  });

  it('should have a middleware to show "health" information', () => {
    // Given
    const configuration = {
      name: 'my-config',
      version: 'alpha5',
    };
    const appConfiguration = {
      get: jest.fn(() => configuration),
    };
    const responsesBuilder = {
      json: jest.fn(),
    };
    const request = 'request';
    const response = 'response';
    let sut = null;
    let middleware = null;
    const expectedData = {
      isHealthy: true,
      status: statuses.ok,
      configuration: configuration.name,
      version: configuration.version,
    };
    // When
    sut = new HealthController(appConfiguration, responsesBuilder);
    middleware = sut.health();
    middleware(request, response);
    // Then
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(['name', 'version']);
    expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
    expect(responsesBuilder.json).toHaveBeenCalledWith(response, expectedData);
  });

  it('should include a controller shorthand to return its routes', () => {
    // Given
    const services = {
      router: {
        get: jest.fn((route, middleware) => [`get:${route}`, middleware.toString()]),
      },
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let routes = null;
    let toCompare = null;
    const expectedGets = ['router', 'appConfiguration', 'responsesBuilder'];
    // When
    routes = healthController.connect(app);
    toCompare = new HealthController('appConfiguration', 'responsesBuilder');
    // Then
    expect(routes).toEqual([
      ['get:/', toCompare.health().toString()],
    ]);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
