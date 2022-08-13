import {
  FastHTML,
  fastHTMLMiddleware,
  type FastHTMLOptions,
  type FastHTMLConstructorOptions,
} from '@src/middlewares/html/fastHTML';
import type { HTMLGenerator, SendFile } from '@src/services';
import type { AsyncExpressMiddleware, Events, Request, Response } from '@src/types';
import { getJimpexMock } from '@tests/mocks';

describe('middlewares/html:fastHTML', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const events = {
        once: jest.fn(),
      };
      const options: FastHTMLConstructorOptions = {
        inject: {
          sendFile: (() => {}) as SendFile,
          events: events as unknown as Events,
        },
      };
      // When
      const sut = new FastHTML(options);
      // Then
      expect(sut).toBeInstanceOf(FastHTML);
      expect(sut.getOptions()).toEqual({
        file: 'index.html',
        ignoredRoutes: [/\.ico$/i],
        useAppRoutes: true,
      });
      expect(events.once).toHaveBeenCalledTimes(1);
      expect(events.once).toHaveBeenCalledWith('afterStart', expect.any(Function));
    });

    it('should be instantiated with custom options', () => {
      // Given
      const events = {
        once: jest.fn(),
      };
      const baseOptions: FastHTMLOptions = {
        file: 'charo.html',
        useAppRoutes: false,
        ignoredRoutes: [/\.jpg$/i],
      };
      const options: FastHTMLConstructorOptions = {
        inject: {
          sendFile: (() => {}) as SendFile,
          events: events as unknown as Events,
        },
        ...baseOptions,
      };
      // When
      const sut = new FastHTML(options);
      // Then
      expect(sut).toBeInstanceOf(FastHTML);
      expect(sut.getOptions()).toEqual(baseOptions);
      expect(events.once).toHaveBeenCalledTimes(0);
    });

    it('should throw an error if no `ignoredRoutes` or `useAppRoutes` are enabled', () => {
      // Given
      const options: FastHTMLConstructorOptions = {
        inject: {
          sendFile: (() => {}) as SendFile,
          events: {} as unknown as Events,
        },
        useAppRoutes: false,
        ignoredRoutes: [],
      };
      // When/Then
      expect(() => new FastHTML(options)).toThrow(
        /You must provide either `ignoredRoutes` or `useAppRoutes`/i,
      );
    });

    describe('middleware', () => {
      it('should skip validations if the route is to be ignored', async () => {
        // Given
        const options: FastHTMLConstructorOptions = {
          inject: {
            sendFile: (() => {}) as SendFile,
            events: {} as unknown as Events,
          },
          useAppRoutes: false,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          originalUrl: 'favicon.ico',
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new FastHTML(options);
        await sut.middleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should skip validations if the route is controlled', async () => {
        // Given
        const routes = ['services/:name/status', '/'];
        const app = {
          getRoutes: jest.fn(() => routes),
        };
        let listener: (arg: { app: typeof app }) => void = () => {};
        const events = {
          once: jest.fn((_: string, cb: typeof listener) => {
            listener = cb;
          }),
        };
        const options: FastHTMLConstructorOptions = {
          inject: {
            sendFile: (() => {}) as SendFile,
            events: events as unknown as Events,
          },
          ignoredRoutes: [],
        };
        const setHeader = jest.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
          originalUrl: '/services/health/status',
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new FastHTML(options);
        listener({ app });
        await sut.middleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('should serve an HTML file', async () => {
        // Given
        const sendFile = jest.fn();
        const options: FastHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            events: {} as unknown as Events,
          },
          useAppRoutes: false,
        };
        const setHeader = jest.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
          originalUrl: '/',
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new FastHTML(options);
        await sut.middleware()(request, response, next);
        // Then
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith({
          res: response,
          next,
          filepath: 'index.html',
        });
        expect(setHeader).toHaveBeenCalledTimes(1);
        expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
        expect(next).toHaveBeenCalledTimes(0);
      });

      it('should serve an HTML file from the HTMLGenerator', async () => {
        // Given
        const sendFile = jest.fn();
        const htmlGeneratorFile = 'charo.html';
        const htmlGenerator = {
          whenReady: jest.fn(() => Promise.resolve()),
          getOptions: jest.fn(() => ({
            file: htmlGeneratorFile,
          })),
        };
        const getHTMLGenerator = jest.fn(() => htmlGenerator as unknown as HTMLGenerator);
        const options: FastHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            events: {} as unknown as Events,
            getHTMLGenerator,
          },
          useAppRoutes: false,
        };
        const setHeader = jest.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
          originalUrl: '/',
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new FastHTML(options);
        await sut.middleware()(request, response, next);
        await sut.middleware()(request, response, next);
        // Then
        expect(sendFile).toHaveBeenCalledTimes(2);
        expect(sendFile).toHaveBeenNthCalledWith(1, {
          res: response,
          next,
          filepath: htmlGeneratorFile,
        });
        expect(sendFile).toHaveBeenNthCalledWith(2, {
          res: response,
          next,
          filepath: htmlGeneratorFile,
        });
        expect(getHTMLGenerator).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.getOptions).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledTimes(0);
      });

      it('should fail serve an HTML file from the HTMLGenerator', async () => {
        // Given
        const sendFile = jest.fn();
        const htmlGeneratorError = new Error('htmlGeneratorError');
        const htmlGenerator = {
          whenReady: jest.fn(() => Promise.reject(htmlGeneratorError)),
        };
        const getHTMLGenerator = jest.fn(() => htmlGenerator as unknown as HTMLGenerator);
        const options: FastHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            events: {} as unknown as Events,
            getHTMLGenerator,
          },
          useAppRoutes: false,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          originalUrl: '/',
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new FastHTML(options);
        await sut.middleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(htmlGeneratorError);
      });
    });
  });

  describe('middleware', () => {
    it('should configure it for the container and and serve an HTML file', async () => {
      // Given
      const sendFile = jest.fn();
      const events = {
        once: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          sendFile,
          events,
        },
      });
      const setHeader = jest.fn();
      const response = {
        response: true,
        setHeader,
      } as unknown as Response;
      const request = {
        request: true,
        originalUrl: '/',
      } as unknown as Request;
      const next = jest.fn();
      // When
      const sut = fastHTMLMiddleware.connect(container);
      await (sut as AsyncExpressMiddleware)(request, response, next);
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(2);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'events');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'sendFile');
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith('htmlGenerator');
      expect(sendFile).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledWith({
        res: response,
        next,
        filepath: 'index.html',
      });
    });

    it('should configure it for the container and use a custom htmlGenerator', async () => {
      // Given
      const sendFile = jest.fn();
      const events = {
        once: jest.fn(),
      };
      const htmlGeneratorFile = 'charo.html';
      const htmlGenerator = {
        whenReady: jest.fn(() => Promise.resolve()),
        getOptions: jest.fn(() => ({
          file: htmlGeneratorFile,
        })),
      };
      const htmlGeneratorName = 'myHtmlGenerator';
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          sendFile,
          events,
          [htmlGeneratorName]: htmlGenerator,
        },
      });
      const setHeader = jest.fn();
      const response = {
        response: true,
        setHeader,
      } as unknown as Response;
      const request = {
        request: true,
        originalUrl: '/',
      } as unknown as Request;
      const next = jest.fn();
      // When
      const sut = fastHTMLMiddleware({
        htmlGeneratorServiceName: htmlGeneratorName,
      }).connect(container);
      await (sut as AsyncExpressMiddleware)(request, response, next);
      // Then
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith(htmlGeneratorName);
      expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
      expect(htmlGenerator.getOptions).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledWith({
        res: response,
        next,
        filepath: htmlGeneratorFile,
      });
    });
  });
});
