jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/middlewares/common/hsts');

require('jasmine-expect');
const {
  HSTS,
  hsts,
} = require('../../../src/middlewares/common/hsts');

describe('middlewares/common:hsts', () => {
  it('should be instantiated with its default options', () => {
    // Given
    let sut = null;
    // When
    sut = new HSTS();
    // Then
    expect(sut).toBeInstanceOf(HSTS);
    expect(sut.header).toBe('max-age=31536000; includeSubDomains');
  });

  it('should be instantiated with custom options', () => {
    // Given
    let sut = null;
    const maxAge = 2506;
    const includeSubDomains = false;
    const preload = true;
    // When
    sut = new HSTS({
      maxAge,
      includeSubDomains,
      preload,
    });
    // Then
    expect(sut.header).toBe(`max-age=${maxAge}; preload`);
  });

  it('should return a middleware that sets the HSTS header', () => {
    // Given
    let sut = null;
    let middleware = null;
    const maxAge = 2506;
    const includeSubDomains = false;
    const preload = true;
    const request = null;
    const setHeader = jest.fn();
    const response = { setHeader };
    const next = jest.fn();
    // When
    sut = new HSTS({
      maxAge,
      includeSubDomains,
      preload,
    });
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      `max-age=${maxAge}; preload`,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should create a middleware with the options from the configuration', () => {
    // Given
    const appConfiguration = {
      get: jest.fn(() => ({})),
    };
    const app = {
      get: jest.fn(() => appConfiguration),
    };
    let middleware = null;
    let toCompare = null;
    // When
    toCompare = new HSTS();
    middleware = hsts.connect(app);
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('appConfiguration');
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('hsts');
  });

  it('should create a middleware even if the configuration doesn\'t have hsts settings', () => {
    // Given
    const appConfiguration = {
      get: jest.fn(),
    };
    const app = {
      get: jest.fn(() => appConfiguration),
    };
    let middleware = null;
    let toCompare = null;
    const request = null;
    const setHeader = jest.fn();
    const response = { setHeader };
    const next = jest.fn();
    // When
    toCompare = new HSTS();
    middleware = hsts.connect(app);
    middleware(request, response, next);
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('appConfiguration');
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith('hsts');
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('shouldn\'t return the middleware if the \'enabled\' flag is \'false\'', () => {
    // Given
    const appConfiguration = {
      get: jest.fn(() => ({
        enabled: false,
      })),
    };
    const app = {
      get: jest.fn(() => appConfiguration),
    };
    let middleware = null;
    // When
    middleware = hsts.connect(app);
    // Then
    expect(middleware).toBeNull();
  });

  it('should create a middleware with custom options', () => {
    // Given
    const app = {
      get: jest.fn(),
    };
    let middleware = null;
    const maxAge = 2506;
    const includeSubDomains = false;
    const request = null;
    const setHeader = jest.fn();
    const response = { setHeader };
    const next = jest.fn();
    // When
    middleware = hsts({ maxAge, includeSubDomains }).connect(app);
    middleware(request, response, next);
    // Then
    expect(setHeader).toHaveBeenCalledTimes(1);
    expect(setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      `max-age=${maxAge}`,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
