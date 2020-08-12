jest.unmock('/src/utils/wrappers');
jest.unmock('/src/middlewares/common/forceHTTPS');

require('jasmine-expect');
const {
  ForceHTTPS,
  forceHTTPS,
} = require('/src/middlewares/common/forceHTTPS');

describe('middlewares/common:forceHTTPS', () => {
  it('should be instantiated with its default options', () => {
    // Given
    let sut = null;
    // When
    sut = new ForceHTTPS();
    // Then
    expect(sut).toBeInstanceOf(ForceHTTPS);
    expect(sut.ignoredRoutes).toBeArray();
  });

  it('should be instantiated with a custom expression for ignored files', () => {
    // Given
    const ignoredFiles = [/^\/my-private-route\//];
    let sut = null;
    // When
    sut = new ForceHTTPS(ignoredFiles);
    // Then
    expect(sut).toBeInstanceOf(ForceHTTPS);
    expect(sut.ignoredRoutes).toEqual(ignoredFiles);
  });

  it('should return a middleware to force the traffic to HTTPS', () => {
    // Given
    const request = {
      secure: false,
      'X-Forwarded-Proto': 'http',
      Host: 'jimpex.github.io',
      get: jest.fn((prop) => request[prop]),
      url: '/index.html',
      originalUrl: '/index.html',
    };
    const response = {
      redirect: jest.fn(),
    };
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    const expectedGets = ['X-Forwarded-Proto', 'Host'];
    // When
    sut = new ForceHTTPS();
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(request.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((prop) => {
      expect(request.get).toHaveBeenCalledWith(prop);
    });
    expect(response.redirect).toHaveBeenCalledTimes(1);
    expect(response.redirect).toHaveBeenCalledWith(`https://${request.Host}${request.url}`);
    expect(next).toHaveBeenCalledTimes(0);
  });

  it('shouldn\'t redirect if the request is already on HTTPS', () => {
    // Given
    const request = {
      secure: true,
      'X-Forwarded-Proto': 'https',
      Host: 'jimpex.github.io',
      get: jest.fn((prop) => request[prop]),
      url: '/index.html',
      originalUrl: '/index.html',
    };
    const response = {
      redirect: jest.fn(),
    };
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new ForceHTTPS();
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(request.get).toHaveBeenCalledTimes(0);
    expect(response.redirect).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t redirect if the request matches one of the ignored routes', () => {
    // Given
    const ignoredRoutes = [/^\/index\.html$/];
    const request = {
      secure: false,
      'X-Forwarded-Proto': 'http',
      Host: 'jimpex.github.io',
      get: jest.fn((prop) => request[prop]),
      url: '/index.html',
      originalUrl: '/index.html',
    };
    const response = {
      redirect: jest.fn(),
    };
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    const expectedGets = ['X-Forwarded-Proto'];
    // When
    sut = new ForceHTTPS(ignoredRoutes);
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(request.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((prop) => {
      expect(request.get).toHaveBeenCalledWith(prop);
    });
    expect(response.redirect).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return the middleware if the `forceHTTPS` configuration flag is `true`', () => {
    // Given
    const appConfiguration = {
      forceHTTPS: true,
      get: jest.fn(() => appConfiguration.forceHTTPS),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'appConfiguration',
    ];
    // When
    middleware = forceHTTPS.connect(app);
    toCompare = new ForceHTTPS();
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('forceHTTPS');
  });

  it('shouldn\'t return the middleware if the `forceHTTPS` configuration flag is `false`', () => {
    // Given
    const appConfiguration = {
      forceHTTPS: false,
      get: jest.fn(() => appConfiguration.forceHTTPS),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let middleware = null;
    const expectedGets = [
      'appConfiguration',
    ];
    // When
    middleware = forceHTTPS.connect(app);
    // Then
    expect(middleware).toBeNull();
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('forceHTTPS');
  });

  it('should support custom options on its wrapper', () => {
    // Given
    const appConfiguration = {
      forceHTTPS: true,
      get: jest.fn(() => appConfiguration.forceHTTPS),
    };
    const services = {
      appConfiguration,
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    const ignoredRoutes = [/^\/index\.html$/];
    const request = {
      secure: false,
      'X-Forwarded-Proto': 'http',
      Host: 'jimpex.github.io',
      get: jest.fn((prop) => request[prop]),
      url: '/index.html',
      originalUrl: '/index.html',
    };
    const response = {
      redirect: jest.fn(),
    };
    const next = jest.fn();
    let middleware = null;
    // When
    middleware = forceHTTPS({ ignoredRoutes }).connect(app);
    middleware(request, response, next);
    // Then
    expect(response.redirect).toHaveBeenCalledTimes(0);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
