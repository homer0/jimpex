jest.unmock('/src/utils/wrappers');
jest.unmock('/src/middlewares/html/fastHTML');

require('jasmine-expect');
const {
  FastHTML,
  fastHTML,
} = require('/src/middlewares/html/fastHTML');

describe('middlewares/html:fastHTML', () => {
  it('should be instantiated', () => {
    // Given
    const sendFile = 'sendFile';
    let sut = null;
    // When
    sut = new FastHTML(sendFile);
    // Then
    expect(sut).toBeInstanceOf(FastHTML);
  });

  it('should be instantiated with the optional htmlGenerator service', () => {
    // Given
    const sendFile = 'sendFile';
    const file = 'random.html';
    const htmlGenerator = {
      getFile: jest.fn(() => file),
    };
    let sut = null;
    // When
    sut = new FastHTML(sendFile, 'index.html', [], htmlGenerator);
    // Then
    expect(sut).toBeInstanceOf(FastHTML);
    expect(sut.file).toBe(file);
    expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
  });

  it('should return a middleware to redirect specific traffic to an html file', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'charito.html';
    const ignoredRoutes = [];
    const request = {
      originalUrl: '/some/path',
    };
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new FastHTML(sendFile, file, ignoredRoutes);
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file, next);
  });

  it('shouldn\'t redirect if the route is on the ignored list', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'charito.html';
    const ignoredRoutes = [/^\/some\//i];
    const request = {
      originalUrl: '/some/path',
    };
    const response = 'response';
    const next = jest.fn();
    let sut = null;
    let middleware = null;
    // When
    sut = new FastHTML(sendFile, file, ignoredRoutes);
    middleware = sut.middleware();
    middleware(request, response, next);
    // Then
    expect(sut.ignoredRoutes).toEqual(ignoredRoutes);
    expect(next).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledTimes(0);
  });

  it(
    'should redirect to the file created by the htmlGenerator service',
    () => new Promise((resolve) => {
      // Given
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'charito.html';
      const ignoredRoutes = [];
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.resolve()),
      };
      const request = {
        originalUrl: '/some/path',
      };
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new FastHTML(sendFile, '', ignoredRoutes, htmlGenerator);
      middleware = sut.middleware();
      middleware(request, response, () => {
        // Then
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith(response, file, expect.any(Function));
        resolve();
      });
    })
    .catch(() => {
      expect(true).toBeFalse();
    })
  );

  it(
    'should fail redirect to the file created by the htmlGenerator service',
    () => new Promise((resolve) => {
      // Given
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'charito.html';
      const ignoredRoutes = [];
      const error = new Error('Unknown error');
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.reject(error)),
      };
      const request = {
        originalUrl: '/some/path',
      };
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      let middleware = null;
      // When
      sut = new FastHTML(sendFile, '', ignoredRoutes, htmlGenerator);
      middleware = sut.middleware();
      middleware(request, response, (result) => {
        // Then
        expect(result).toBe(error);
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledTimes(0);
        resolve();
      });
    })
    .catch(() => {
      expect(true).toBeFalse();
    })
  );

  it('should include a middleware shorthand to return its function', () => {
    // Given
    const services = {};
    const app = {
      get: jest.fn((service) => services[service] || service),
      try: jest.fn(() => null),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'sendFile',
    ];
    const expectedTryAttempts = [
      'htmlGenerator',
    ];
    // When
    middleware = fastHTML.connect(app);
    toCompare = new FastHTML();
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(app.try).toHaveBeenCalledTimes(expectedTryAttempts.length);
    expectedTryAttempts.forEach((service) => {
      expect(app.try).toHaveBeenCalledWith(service);
    });
  });

  it('should include a middleware creator shorthand to configure its options', () => {
    // Given
    const services = {};
    const app = {
      get: jest.fn((service) => services[service] || service),
      try: jest.fn(() => null),
    };
    let middleware = null;
    let toCompare = null;
    const expectedGets = [
      'sendFile',
    ];
    const expectedTryAttempts = [
      'htmlGenerator',
    ];
    // When
    middleware = fastHTML().connect(app);
    toCompare = new FastHTML();
    // Then
    expect(middleware.toString()).toEqual(toCompare.middleware().toString());
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(app.try).toHaveBeenCalledTimes(expectedTryAttempts.length);
    expectedTryAttempts.forEach((service) => {
      expect(app.try).toHaveBeenCalledWith(service);
    });
  });
});
