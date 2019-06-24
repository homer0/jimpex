jest.unmock('/src/utils/functions');
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/controllers/common/statics');

const path = require('path');
require('jasmine-expect');
const {
  StaticsController,
  staticsController,
} = require('/src/controllers/common/statics');

describe('controllers/common:statics', () => {
  it('should be instantiated with its default options', () => {
    // Given
    const sendFile = 'sendFile';
    let sut = null;
    // When
    sut = new StaticsController(sendFile);
    // Then
    expect(sut).toBeInstanceOf(StaticsController);
    expect(sut.getRoutes).toBeFunction();
    expect(sut.options).toEqual({
      files: ['favicon.ico', 'index.html'],
      methods: {
        all: false,
        get: true,
      },
      paths: {
        source: './',
        route: '',
      },
    });
  });

  it('should be instantiated with custom options', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['myfile.html'],
      methods: {
        all: true,
        get: false,
        post: false,
      },
      paths: {
        source: '../',
        route: 'statics/',
      },
    };
    let sut = null;
    // When
    sut = new StaticsController(sendFile, options);
    // Then
    expect(sut).toBeInstanceOf(StaticsController);
    expect(sut.getRoutes).toBeFunction();
    expect(sut.options).toEqual(options);
  });

  it('should throw an error when instantiated without files', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: [],
    };
    // When/Then
    expect(() => new StaticsController(sendFile, options))
    .toThrow(/You need to specify a list of files/i);
  });

  it('should throw an error when instantiated without HTTP methods', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
      methods: null,
    };
    // When/Then
    expect(() => new StaticsController(sendFile, options))
    .toThrow(/You need to specify which HTTP methods are allowed for the files/i);
  });

  it('should throw an error when instantiated without an enabled HTTP method', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
      methods: {
        get: false,
      },
    };
    // When/Then
    expect(() => new StaticsController(sendFile, options))
    .toThrow(/You need to enable at least one HTTP method to serve the files/i);
  });

  it('should throw an error when instantiated with an invalid HTTP method', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
      methods: {
        get: true,
        magic: true,
      },
    };
    // When/Then
    expect(() => new StaticsController(sendFile, options))
    .toThrow(/is not a valid HTTP method/i);
  });

  it('should generate `get` routes for all the files', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    let sut = null;
    let result = null;
    // When
    sut = new StaticsController(sendFile, options);
    result = sut.getRoutes(router);
    // Then
    expect(result).toEqual(options.files.map(() => route));
    expect(router.get).toHaveBeenCalledTimes(options.files.length);
    options.files.forEach((file) => {
      expect(router.get).toHaveBeenCalledWith(`/${file}`, [expect.any(Function)]);
    });
  });

  it('should generate routes using `all`', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
      methods: {
        all: true,
      },
    };
    const route = 'route';
    const router = {
      all: jest.fn(() => route),
    };
    let sut = null;
    let result = null;
    // When
    sut = new StaticsController(sendFile, options);
    result = sut.getRoutes(router);
    // Then
    expect(result).toEqual(options.files.map(() => route));
    expect(router.all).toHaveBeenCalledTimes(options.files.length);
    options.files.forEach((file) => {
      expect(router.all).toHaveBeenCalledWith(`/${file}`, [expect.any(Function)]);
    });
  });

  it('should generate routes using custom methods', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
      methods: {
        get: false,
        post: true,
        put: true,
      },
    };
    const postRoute = 'post-route';
    const putRoute = 'put-route';
    const router = {
      post: jest.fn(() => postRoute),
      put: jest.fn(() => putRoute),
    };
    let sut = null;
    let result = null;
    // When
    sut = new StaticsController(sendFile, options);
    result = sut.getRoutes(router);
    // Then
    expect(result).toEqual(
      options.files
      .map(() => [postRoute, putRoute])
      .reduce((acc, routes) => [...acc, ...routes], [])
    );
    expect(router.post).toHaveBeenCalledTimes(options.files.length);
    expect(router.put).toHaveBeenCalledTimes(options.files.length);
    options.files.forEach((file) => {
      expect(router.post).toHaveBeenCalledWith(`/${file}`, [expect.any(Function)]);
      expect(router.put).toHaveBeenCalledWith(`/${file}`, [expect.any(Function)]);
    });
  });

  it('should add custom middlewares to the routes', () => {
    // Given
    const sendFile = 'sendFile';
    const options = {
      files: ['charito.html'],
    };
    const middlewares = ['middlewareOne', 'middlewareTwo'];
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    let sut = null;
    let result = null;
    // When
    sut = new StaticsController(sendFile, options);
    result = sut.getRoutes(router, middlewares);
    // Then
    expect(result).toEqual(options.files.map(() => route));
    expect(router.get).toHaveBeenCalledTimes(options.files.length);
    options.files.forEach((file) => {
      expect(router.get).toHaveBeenCalledWith(`/${file}`, [
        ...middlewares,
        expect.any(Function),
      ]);
    });
  });

  it('should generate a middleware to serve a file', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'rosario.html';
    const options = {
      files: [file],
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new StaticsController(sendFile, options);
    sut.getRoutes(router);
    [[, [middleware]]] = router.get.mock.calls;
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(response, file, next);
  });

  it('should generate a middleware to serve a file from a custom directory', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'rosario.html';
    const options = {
      files: [file],
      paths: {
        source: '../',
      },
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new StaticsController(sendFile, options);
    sut.getRoutes(router);
    [[, [middleware]]] = router.get.mock.calls;
    middleware(request, response, next);
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(
      response,
      path.join(options.paths.source, file),
      next
    );
  });

  it('should generate a middleware to serve a file to a different route', () => {
    // Given
    const sendFile = jest.fn();
    const file = 'rosario.html';
    const options = {
      files: [file],
      paths: {
        source: '../',
        route: '/statics',
      },
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new StaticsController(sendFile, options);
    sut.getRoutes(router);
    [[, [middleware]]] = router.get.mock.calls;
    middleware(request, response, next);
    // Then
    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenCalledWith(
      `${options.paths.route}/${file}`,
      [expect.any(Function)]
    );
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(
      response,
      path.join(options.paths.source, file),
      next
    );
  });

  it('should generate a middleware to serve a file with custom route and path', () => {
    // Given
    const sendFile = jest.fn();
    const file = {
      source: '../rosario.png',
      route: 'photos/charito.png',
    };
    const options = {
      files: [file],
      paths: {
        source: '../',
        route: '/statics',
      },
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    // When
    sut = new StaticsController(sendFile, options);
    sut.getRoutes(router);
    [[, [middleware]]] = router.get.mock.calls;
    middleware(request, response, next);
    // Then
    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenCalledWith(
      `${options.paths.route}/${file.route}`,
      [expect.any(Function)]
    );
    expect(response.setHeader).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(
      response,
      path.join(options.paths.source, file.source),
      next
    );
  });

  it('should generate a middleware to serve a file with custom headers', () => {
    // Given
    const sendFile = jest.fn();
    const customHeaderName = 'x-custom-header';
    const customHeaderValue = 'magic!';
    const file = {
      source: '../rosario.png',
      route: 'photos/charito.png',
      headers: {
        [customHeaderName]: customHeaderValue,
      },
    };
    const options = {
      files: [file],
      paths: {
        source: '../',
        route: '/statics',
      },
    };
    const route = 'route';
    const router = {
      get: jest.fn(() => route),
    };
    const request = 'request';
    const response = {
      setHeader: jest.fn(),
    };
    const next = 'next';
    let sut = null;
    let middleware = null;
    const expectedHeaders = [
      [customHeaderName, customHeaderValue],
      ['Content-Type', 'image/png'],
    ];
    // When
    sut = new StaticsController(sendFile, options);
    sut.getRoutes(router);
    [[, [middleware]]] = router.get.mock.calls;
    middleware(request, response, next);
    // Then
    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenCalledWith(
      `${options.paths.route}/${file.route}`,
      [expect.any(Function)]
    );
    expect(response.setHeader).toHaveBeenCalledTimes(expectedHeaders.length);
    expectedHeaders.forEach((setHeaderCall) => {
      expect(response.setHeader).toHaveBeenCalledWith(...setHeaderCall);
    });
    expect(sendFile).toHaveBeenCalledTimes(1);
    expect(sendFile).toHaveBeenCalledWith(
      response,
      path.join(options.paths.source, file.source),
      next
    );
  });

  it('should include a controller shorthand to return its routes', () => {
    // Given
    const services = {
      router: {
        get: jest.fn((route, middlewaresList) => [`get:${route}`, middlewaresList]),
      },
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let routes = null;
    const expectedGets = ['router', 'sendFile'];
    const expectedFiles = ['favicon.ico', 'index.html'];
    // When
    routes = staticsController.connect(app);
    // Then
    expect(routes).toEqual(expectedFiles.map((file) => [`get:/${file}`, [expect.any(Function)]]));
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });

  it('should include a controller creator to send custom options and middlewares', () => {
    // Given
    const options = {
      files: ['rosario.html'],
    };
    const normalMiddleware = 'middlewareOne';
    const jimpexMiddlewareName = 'middlewareTwo';
    const jimpexMiddleware = {
      connect: jest.fn(() => jimpexMiddlewareName),
    };
    const middlewares = [normalMiddleware, jimpexMiddleware];
    const middlewareGenerator = jest.fn(() => middlewares);
    const services = {
      router: {
        get: jest.fn((route, middlewaresList) => [`get:${route}`, middlewaresList]),
      },
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let routes = null;
    const expectedGets = ['router', 'sendFile'];
    // When
    routes = staticsController(options, middlewareGenerator).connect(app);
    // Then
    expect(routes).toEqual(options.files.map((file) => [
      `get:/${file}`,
      [
        ...[normalMiddleware, jimpexMiddlewareName],
        expect.any(Function),
      ],
    ]));
    expect(middlewareGenerator).toHaveBeenCalledTimes(1);
    expect(middlewareGenerator).toHaveBeenCalledWith(app);
    expect(jimpexMiddleware.connect).toHaveBeenCalledTimes(1);
    expect(jimpexMiddleware.connect).toHaveBeenCalledWith(app);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
