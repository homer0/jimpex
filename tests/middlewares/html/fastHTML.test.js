jest.unmock('../../../src/utils/functions');
jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/middlewares/html/fastHTML');

const {
  FastHTML,
  fastHTML,
} = require('../../../src/middlewares/html/fastHTML');
const { eventNames } = require('../../../src/constants');

describe('middlewares/html:fastHTML', () => {
  it('should be instantiated with its default options', () => {
    // Given
    const events = {
      once: jest.fn(),
    };
    const sendFile = 'sendFile';
    let sut = null;
    // When
    sut = new FastHTML(events, sendFile);
    // Then
    expect(sut).toBeInstanceOf(FastHTML);
    expect(sut.options).toEqual({
      file: 'index.html',
      ignore: [/\.ico$/i],
      useAppRoutes: true,
    });
    expect(events.once).toHaveBeenCalledTimes(1);
    expect(events.once).toHaveBeenCalledWith(eventNames.afterStart, expect.any(Function));
  });

  it('should be instantiated with custom options', () => {
    // Given
    const events = {
      once: jest.fn(),
    };
    const sendFile = 'sendFile';
    const options = {
      file: 'my-file.html',
      ignore: [/\.jpg$/i],
      useAppRoutes: false,
    };
    let sut = null;
    // When
    sut = new FastHTML(events, sendFile, options);
    // Then
    expect(sut).toBeInstanceOf(FastHTML);
    expect(sut.options).toEqual(options);
    expect(events.once).toHaveBeenCalledTimes(0);
  });

  it('should be instantiated and obtain the file from an HTMLGenerator service', () => {
    // Given
    const events = 'events';
    const sendFile = 'sendFile';
    const options = {
      file: 'my-file.html',
      useAppRoutes: false,
    };
    const overwriteFile = 'my-other-file.html';
    const htmlGenerator = {
      getFile: jest.fn(() => overwriteFile),
    };
    let sut = null;
    // When
    sut = new FastHTML(events, sendFile, options, htmlGenerator);
    // Then
    expect(sut).toBeInstanceOf(FastHTML);
    expect(sut.options.file).toEqual(overwriteFile);
  });

  it('should throw an error when instantiated without a file and an HTMLGenerator', () => {
    // Given
    const events = 'events';
    const sendFile = 'sendFile';
    const options = {
      file: null,
      useAppRoutes: false,
    };
    // When/Then
    expect(() => new FastHTML(events, sendFile, options))
    .toThrow(/You need to either define an HTMLGenerator service or a file/i);
  });

  it('should throw an error if there are no ignored routes and `useAppRoutes` is `false`', () => {
    // Given
    const events = 'events';
    const sendFile = 'sendFile';
    const options = {
      ignore: [],
      useAppRoutes: false,
    };
    // When/Then
    expect(() => new FastHTML(events, sendFile, options))
    .toThrow(/You need to either define a list of routes to ignore or use `useAppRoutes`/i);
  });

  describe('middleware', () => {
    it('should show the HTML file if the URL is not on the `ignore` list', () => {
      // Given
      const events = 'events';
      const sendFile = jest.fn();
      const options = {
        file: 'my-file.html',
        useAppRoutes: false,
      };
      const request = {
        originalUrl: '/some/path',
      };
      const response = {
        setHeader: jest.fn(),
      };
      const next = 'next';
      let sut = null;
      // When
      sut = new FastHTML(events, sendFile, options);
      sut.middleware()(request, response, next);
      // Then
      expect(response.setHeader).toHaveBeenCalledTimes(1);
      expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(sendFile).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledWith(response, options.file, next);
    });

    it('shouldn\'t show the HTML file if the URL is on the `ignore` list', () => {
      // Given
      const events = 'events';
      const sendFile = jest.fn();
      const options = {
        file: 'my-file.html',
        ignore: [/\.png$/i],
        useAppRoutes: false,
      };
      const request = {
        originalUrl: '/some/path.png',
      };
      const response = 'response';
      const next = jest.fn();
      let sut = null;
      // When
      sut = new FastHTML(events, sendFile, options);
      sut.middleware()(request, response, next);
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledTimes(0);
    });

    it('should validate the requests against the controlled routes', () => {
      // Given
      const events = {
        once: jest.fn(),
      };
      const sendFile = jest.fn();
      const options = {
        file: 'my-file.html',
      };
      const casesForSuccess = [
        {
          route: '/api/:version',
          url: '/api/abc123',
        },
        {
          route: '/something',
          url: '/something',
        },
        {
          route: '/service',
          url: '/service/health',
        },
        {
          route: '/service/:name/status',
          url: '/service/health/status',
        },
        {
          route: '/service/:name/status',
          url: '/service/health/status/extra',
        },
      ];
      const casesForFailure = [
        {
          route: '/other-api/:version/resource',
          url: '/other-api/abc123/res',
        },
        {
          route: '/other-services/health/extra',
          url: '/other-services/health',
        },
      ];
      const cases = [
        ...casesForSuccess,
        ...casesForFailure,
      ];
      const routes = cases.map(({ route }) => route);
      const response = {
        setHeader: jest.fn(),
      };
      const next = jest.fn();
      let sut = null;
      let middleware = null;
      let listener = null;
      // When
      sut = new FastHTML(events, sendFile, options);
      [[, listener]] = events.once.mock.calls;
      listener({ routes });
      middleware = sut.middleware();
      cases.forEach(({ url }) => {
        middleware({ originalUrl: url }, response, next);
      });
      // Then
      expect(next).toHaveBeenCalledTimes(casesForSuccess.length);
      expect(sendFile).toHaveBeenCalledTimes(casesForFailure.length);
    });

    it('should show the HTML file created by an HTMLGenerator', () => new Promise((resolve) => {
      // Given
      const events = 'events';
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'Pilar.html';
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.resolve()),
      };
      const options = {
        file: 'my-file.html',
        ignore: [/\.png$/i],
        useAppRoutes: false,
      };
      const request = {
        originalUrl: '/some/path.jpg',
      };
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      // When
      sut = new FastHTML(events, sendFile, options, htmlGenerator);
      sut.middleware()(request, response, () => {
        // Then
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith(response, file, expect.any(Function));
        resolve();
      });
    }));

    it('should fail to show the HTML file from the HTMLGenerator', () => new Promise((resolve) => {
      // Given
      const events = 'events';
      const sendFile = jest.fn((res, file, next) => next());
      const file = 'Pilar.html';
      const error = new Error('Unknown error');
      const htmlGenerator = {
        getFile: jest.fn(() => file),
        whenReady: jest.fn(() => Promise.reject(error)),
      };
      const options = {
        file: 'my-file.html',
        ignore: [/\.png$/i],
        useAppRoutes: false,
      };
      const request = {
        originalUrl: '/some/path.jpg',
      };
      const response = {
        setHeader: jest.fn(),
      };
      let sut = null;
      // When
      sut = new FastHTML(events, sendFile, options, htmlGenerator);
      sut.middleware()(request, response, (result) => {
        // Then
        expect(result).toBe(error);
        expect(htmlGenerator.getFile).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        resolve();
      });
    }));
  });

  describe('shorthand', () => {
    it('should return the middleware', () => {
      // Given
      const events = {
        once: jest.fn(),
      };
      const services = {
        events,
      };
      const app = {
        get: jest.fn((service) => services[service] || service),
        try: jest.fn(() => null),
      };
      let middleware = null;
      let toCompare = null;
      const expectedGets = [
        'events',
        'sendFile',
      ];
      const expectedTryAttempts = [
        'htmlGenerator',
      ];
      // When
      middleware = fastHTML.connect(app);
      toCompare = new FastHTML('events', 'sendFile', { useAppRoutes: false });
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
      expect(events.once).toHaveBeenCalledTimes(1);
      expect(events.once).toHaveBeenCalledWith(eventNames.afterStart, expect.any(Function));
    });

    it('should allow the options to be customized', () => {
      // Given
      const events = {
        once: jest.fn(),
      };
      const services = {
        events,
      };
      const options = {
        htmlGenerator: null,
        useAppRoutes: false,
      };
      const app = {
        get: jest.fn((service) => services[service] || service),
        try: jest.fn(() => null),
      };
      let middleware = null;
      let toCompare = null;
      const expectedGets = [
        'events',
        'sendFile',
      ];
      // When
      middleware = fastHTML(options).connect(app);
      toCompare = new FastHTML('events', 'sendFile', { useAppRoutes: false });
      // Then
      expect(middleware.toString()).toEqual(toCompare.middleware().toString());
      expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
      expectedGets.forEach((service) => {
        expect(app.get).toHaveBeenCalledWith(service);
      });
      expect(app.try).toHaveBeenCalledTimes(0);
      expect(events.once).toHaveBeenCalledTimes(0);
    });
  });
});
