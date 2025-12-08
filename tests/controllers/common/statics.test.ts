import { vi, describe, it, expect } from 'vitest';
import type mime from 'mime';
import {
  StaticsController,
  staticsController,
  type StaticsControllerOptions,
  type StaticsControllerConstructorOptions,
} from '@src/controllers/common/statics.js';
import type { SendFile } from '@src/services/index.js';
import type { MiddlewareLike } from '@src/utils/index.js';
import type {
  ExpressMiddleware,
  Request,
  Response,
  RouterMethod,
} from '@src/types/index.js';
import { getJimpexMock, getRouterMock } from '@tests/mocks/index.js';

type Mime = typeof mime;

describe('controllers/common:statics', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
      };
      // When
      const sut = new StaticsController(options);
      // Then
      expect(sut).toBeInstanceOf(StaticsController);
      expect(sut.options).toEqual({
        files: ['favicon.ico', 'index.html'],
        methods: {
          all: false,
          get: true,
        },
        paths: {
          route: '',
          source: './',
        },
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const baseOptions: StaticsControllerOptions = {
        files: ['charo.js', 'pili.jsx'],
        methods: {
          post: true,
          patch: true,
        },
        paths: {
          route: 'statics/',
          source: '../',
        },
      };
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
        ...baseOptions,
      };
      // When
      const sut = new StaticsController(options);
      // Then
      expect(sut).toBeInstanceOf(StaticsController);
      expect(sut.options).toEqual(baseOptions);
    });

    it('should throw an error when instantiated without files', () => {
      // Given
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
        files: [],
      };
      // When/Then
      expect(() => new StaticsController(options)).toThrow(
        /You need to specify a list of files/i,
      );
    });

    it('should throw an error when instantiated without HTTP methods', () => {
      // Given
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
        // @ts-expect-error - Testing if no methods are provided.
        methods: null,
      };
      // When/Then
      expect(() => new StaticsController(options)).toThrow(
        /You need to specify which HTTP methods are allowed for the files/i,
      );
    });

    it('should throw an error when instantiated without an enabled HTTP methods', () => {
      // Given
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
        methods: {
          get: false,
        },
      };
      // When/Then
      expect(() => new StaticsController(options)).toThrow(
        /You need to enable at least one HTTP method to serve the files/i,
      );
    });

    it('should throw an error when instantiated with an invalid HTTP method', () => {
      // Given
      const options: StaticsControllerConstructorOptions = {
        inject: {
          sendFile: {} as SendFile,
          mime: {} as Mime,
        },
        methods: {
          get: true,
          // @ts-expect-error - Testing an invalid method.
          magic: false,
        },
      };
      // When/Then
      expect(() => new StaticsController(options)).toThrow(/is not a valid HTTP method/i);
    });

    describe('addRoutes', () => {
      it('should register `get` routes for all the files', () => {
        // Given
        const files = ['charo.html', 'pili.htm'];
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: {} as SendFile,
            mime: {} as Mime,
          },
          files,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        // Then
        expect(routerMocks.get).toHaveBeenCalledTimes(files.length);
        files.forEach((file) => {
          expect(routerMocks.get).toHaveBeenCalledWith(`/${file}`, [
            expect.any(Function),
          ]);
        });
      });

      it('should register custom routes for the files', () => {
        // Given
        const fileOne = {
          route: 'oldest/charo.html',
          path: '../oldest/index.html',
        };
        const fileTwo = {
          route: 'youngest/pili.htm',
          path: '../youngest/index.html',
        };
        const files = [fileOne, fileTwo];
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: {} as SendFile,
            mime: {} as Mime,
          },
          files,
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        // Then
        expect(routerMocks.get).toHaveBeenCalledTimes(files.length);
        files.forEach((file) => {
          expect(routerMocks.get).toHaveBeenCalledWith(`/${file.route}`, [
            expect.any(Function),
          ]);
        });
      });

      it('should register `all` routes for the files', () => {
        // Given
        const files = ['charo.html', 'pili.htm'];
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: {} as SendFile,
            mime: {} as Mime,
          },
          files,
          methods: {
            all: true,
          },
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        // Then
        expect(routerMocks.get).toHaveBeenCalledTimes(0);
        expect(routerMocks.all).toHaveBeenCalledTimes(files.length);
        files.forEach((file) => {
          expect(routerMocks.all).toHaveBeenCalledWith(`/${file}`, [
            expect.any(Function),
          ]);
        });
      });

      it('should register routes with custom methods', () => {
        // Given
        const files = ['charo.html', 'pili.htm'];
        const methods = ['post', 'put'] as const;
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: {} as SendFile,
            mime: {} as Mime,
          },
          files,
          methods: {
            get: false,
            ...methods.reduce(
              (acc, method) => {
                acc[method] = true;
                return acc;
              },
              {} as Partial<Record<RouterMethod, boolean>>,
            ),
          },
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        // Then
        expect(routerMocks.get).toHaveBeenCalledTimes(0);
        methods.forEach((method) => {
          expect(routerMocks[method]).toHaveBeenCalledTimes(files.length);
          files.forEach((file) => {
            expect(routerMocks[method]).toHaveBeenCalledWith(`/${file}`, [
              expect.any(Function),
            ]);
          });
        });
      });

      it('should add custom middlewares to the routes', () => {
        // Given
        const files = ['charo.html', 'pili.htm'];
        const middlewares = ['middlewareOne', 'middlewareTwo'];
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: {} as SendFile,
            mime: {} as Mime,
          },
          files,
          methods: {
            get: true,
          },
        };
        const { router, routerMocks } = getRouterMock();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router, middlewares as unknown as ExpressMiddleware[]);
        // Then
        expect(routerMocks.get).toHaveBeenCalledTimes(files.length);
        files.forEach((file) => {
          expect(routerMocks.get).toHaveBeenCalledWith(`/${file}`, [
            ...middlewares,
            expect.any(Function),
          ]);
        });
      });
    });

    describe('middleware', () => {
      it('should serve a file', () => {
        // Given
        const file = 'charo.jpg';
        const header = 'image/jpg';
        const mimeFn = {
          getType: vi.fn(() => header),
        };
        const sendFile = vi.fn();
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            mime: mimeFn as unknown as Mime,
          },
          files: [file],
        };
        const { router, routerMocks } = getRouterMock();
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.get.mock.calls as unknown as [
          [string, [ExpressMiddleware]],
        ];
        middleware(request, response, next);
        // Then
        expect(setHeader).toHaveBeenCalledTimes(1);
        expect(setHeader).toHaveBeenCalledWith('Content-Type', header);
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith({
          res: response,
          filepath: file,
          next,
        });
      });

      it("should use text/html if the content-type can't be inferred", () => {
        // Given
        const file = 'charo.jpg';
        const mimeFn = {
          getType: vi.fn(() => ''),
        };
        const sendFile = vi.fn();
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            mime: mimeFn as unknown as Mime,
          },
          files: [file],
        };
        const { router, routerMocks } = getRouterMock();
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.get.mock.calls as unknown as [
          [string, [ExpressMiddleware]],
        ];
        middleware(request, response, next);
        // Then
        expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      });

      it('should serve a file with a custom route and path', () => {
        // Given
        const fileRoute = '/daughters/charo.jpg';
        const filePath = '../images/daughters/charo.jpg';
        const header = 'image/jpg';
        const mimeFn = {
          getType: vi.fn(() => header),
        };
        const sendFile = vi.fn();
        const options: StaticsControllerConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            mime: mimeFn as unknown as Mime,
          },
          files: [
            {
              route: fileRoute,
              path: filePath,
            },
          ],
        };
        const { router, routerMocks } = getRouterMock();
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new StaticsController(options);
        sut.addRoutes(router);
        const [[, [middleware]]] = routerMocks.get.mock.calls as unknown as [
          [string, [ExpressMiddleware]],
        ];
        middleware(request, response, next);
        // Then
        expect(routerMocks.get).toHaveBeenCalledWith(fileRoute, [expect.any(Function)]);
        expect(setHeader).toHaveBeenCalledTimes(1);
        expect(setHeader).toHaveBeenCalledWith('Content-Type', header);
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith({
          res: response,
          filepath: filePath,
          next,
        });
      });
    });
  });

  describe('controller', () => {
    it('should register `get` routes for all the files', () => {
      // Given
      const defaultFiles = ['favicon.ico', 'index.html'];
      const { router, routerMocks } = getRouterMock();
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          router,
        },
      });
      // When
      const result = staticsController.connect(container, '/');
      // Then
      expect(result).toBe(router);
      expect(mocks.get).toHaveBeenCalledTimes(3);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'router');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'sendFile');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'mime');
      expect(routerMocks.get).toHaveBeenCalledTimes(defaultFiles.length);
      defaultFiles.forEach((file) => {
        expect(routerMocks.get).toHaveBeenCalledWith(`/${file}`, [expect.any(Function)]);
      });
    });

    it('should add custom middlewares to the routes', () => {
      // Given
      const middlewareOne = {
        name: 'middlewareOne',
      };
      const middlewareTwoStr = 'middlewareTwo';
      const middlewareTwo = {
        middleware: true,
        connect: vi.fn(() => middlewareTwoStr),
      };
      const middlewareThree = {
        middleware: true,
        connect: vi.fn(),
      };
      const middlewares = [middlewareOne, middlewareTwo, middlewareThree];
      const getMiddlewares = vi.fn(() => middlewares as unknown as MiddlewareLike[]);
      const defaultFiles = ['favicon.ico', 'index.html'];
      const { router, routerMocks } = getRouterMock();
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          router,
        },
      });
      // When
      staticsController({
        getMiddlewares,
      }).connect(container, '/');
      // Then
      expect(getMiddlewares).toHaveBeenCalledTimes(1);
      expect(getMiddlewares).toHaveBeenCalledWith(container);
      expect(mocks.get).toHaveBeenCalledTimes(3);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'router');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'sendFile');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'mime');
      expect(routerMocks.get).toHaveBeenCalledTimes(defaultFiles.length);
      defaultFiles.forEach((file) => {
        expect(routerMocks.get).toHaveBeenCalledWith(`/${file}`, [
          ...[middlewareOne, middlewareTwoStr],
          expect.any(Function),
        ]);
      });
    });
  });
});
