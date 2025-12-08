import { vi, describe, it, expect } from 'vitest';
import {
  VersionValidator,
  versionValidatorMiddleware,
  type VersionValidatorConstructorOptions,
} from '@src/middlewares/utils/versionValidator.js';
import { HTTPError, ResponsesBuilder } from '@src/services/index.js';
import type { ExpressMiddleware, Request, Response } from '@src/types/index.js';
import { statuses as realStatuses, type Statuses } from '@src/utils/index.js';
import { getJimpexMock } from '@tests/mocks/index.js';

describe('middlewares/utils:versionValidator', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const statuses = vi.fn();
      const responsesBuilder = {} as ResponsesBuilder;
      const version = 'abc';
      const options: VersionValidatorConstructorOptions = {
        inject: {
          responsesBuilder,
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
        version,
      };
      // When
      const sut = new VersionValidator(options);
      // Then
      expect(sut).toBeInstanceOf(VersionValidator);
      expect(sut.options).toEqual({
        error: "The application version doesn't match",
        latest: {
          allow: true,
          name: 'latest',
        },
        popup: {
          variable: 'popup',
          title: 'Conflict',
          message: 'version:conflict',
        },
        version,
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const statuses = vi.fn();
      const responsesBuilder = {} as ResponsesBuilder;
      const version = 'bcd';
      const customOptions = {
        error: 'Woooo',
        latest: {
          allow: false,
          name: 'newest',
        },
        popup: {
          variable: 'popupWindow',
          title: 'Conflict!!',
          message: 'version:error',
        },
        version,
      };
      const options: VersionValidatorConstructorOptions = {
        inject: {
          responsesBuilder,
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
        ...customOptions,
      };
      // When
      const sut = new VersionValidator(options);
      // Then
      expect(sut.options).toEqual(customOptions);
    });

    it('should be throw an error if the version is falsy', () => {
      // Given
      const statuses = vi.fn();
      const responsesBuilder = {} as ResponsesBuilder;
      const version = '';
      const options: VersionValidatorConstructorOptions = {
        inject: {
          responsesBuilder,
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
        version,
      };
      // When/Then
      expect(() => new VersionValidator(options)).toThrow(
        /You need to supply a version/i,
      );
    });

    describe('middleware', () => {
      it("should skip the validation if there's no `version` param", () => {
        // Given
        const statuses = vi.fn();
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'abc';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: {},
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it('should allow the current version', () => {
        // Given
        const statuses = vi.fn();
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'abc';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it('should allow the latest version', () => {
        // Given
        const statuses = vi.fn();
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'latest';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'abc',
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it('should allow the latest version with a different name', () => {
        // Given
        const statuses = vi.fn();
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'newest';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'abc',
          latest: {
            name: version,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it("should generate an error if the version doesn't match", () => {
        // Given
        const status = realStatuses('conflict');
        const statuses = vi.fn(() => status);
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'abc';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'other',
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
          query: {},
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        const [[error]] = next.mock.calls as [[HTTPError]];
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(error.message).toBe(sut.options.error);
        expect(error.status).toBe(status);
        expect(error.getResponse()).toEqual({
          validation: true,
        });
      });

      it("shouldn't allow the latest version if disabled", () => {
        // Given
        const status = realStatuses('conflict');
        const statuses = vi.fn(() => status);
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'latest';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'other',
          latest: {
            allow: false,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
          query: {},
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        const [[error]] = next.mock.calls as [[HTTPError]];
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(error.message).toBe(sut.options.error);
        expect(error.status).toBe(status);
        expect(error.getResponse()).toEqual({
          validation: true,
        });
      });

      it("shouldn't allow the latest version if the name doesn't match", () => {
        // Given
        const status = realStatuses('conflict');
        const statuses = vi.fn(() => status);
        const responsesBuilder = {} as ResponsesBuilder;
        const version = 'latest';
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'other',
          latest: {
            name: 'newest',
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
          query: {},
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        const [[error]] = next.mock.calls as [[HTTPError]];
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(error.message).toBe(sut.options.error);
        expect(error.status).toBe(status);
        expect(error.getResponse()).toEqual({
          validation: true,
        });
      });

      it("should generate a post message error if the version doesn't match", () => {
        // Given
        const status = realStatuses('conflict');
        const statuses = vi.fn(() => status);
        const responsesBuilder = {
          htmlPostMessage: vi.fn(),
        } as unknown as ResponsesBuilder;
        const version = 'abc';
        const popupOptions = {
          title: 'WOOO',
          message: 'YEAH',
          variable: 'popup',
        };
        const options: VersionValidatorConstructorOptions = {
          inject: {
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          version: 'other',
          popup: popupOptions,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: { version },
          query: {
            [popupOptions.variable]: true,
          },
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new VersionValidator(options);
        sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(0);
        expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.htmlPostMessage).toHaveBeenCalledWith({
          res: response,
          title: popupOptions.title,
          message: popupOptions.message,
          status: realStatuses('conflict'),
        });
      });
    });
  });

  describe('middleware', () => {
    it('should configure it for the container and ignore a non-versioned route', () => {
      // Given
      const version = 'abc';
      const config = {
        get: vi.fn(() => version),
      };
      const status = realStatuses('unauthorized');
      const statuses = vi.fn(() => status);
      const responsesBuilder = {
        json: vi.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          statuses,
          config,
          responsesBuilder,
        },
      });
      const response = {
        response: true,
      } as unknown as Response;
      const request = {
        request: true,
        params: {},
      } as unknown as Request;
      const next = vi.fn();
      // When
      const sut = versionValidatorMiddleware.connect(container);
      (sut as ExpressMiddleware)(request, response, next);
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(4);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'HTTPError');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'responsesBuilder');
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'statuses');
      expect(config.get).toHaveBeenCalledTimes(1);
      expect(config.get).toHaveBeenCalledWith('version');
      expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should configure it as controller', () => {
      // Given
      const version = 'abc';
      const config = {
        get: vi.fn(),
      };
      const status = realStatuses('unauthorized');
      const statuses = vi.fn(() => status);
      const responsesBuilder = {
        json: vi.fn(),
      };
      const routerMessage = 'routerMessage';
      const router = {
        all: vi.fn(() => routerMessage),
      };
      const { container } = getJimpexMock({
        resources: {
          statuses,
          config,
          responsesBuilder,
          router,
        },
      });
      const response = {
        response: true,
      } as unknown as Response;
      const request = {
        request: true,
        params: {
          version,
        },
      } as unknown as Request;
      const next = vi.fn();
      const route = 'some-route';
      // When
      const sut = versionValidatorMiddleware({ version }).connect(container, route);
      const [[, middleware]] = router.all.mock.calls as unknown as [
        [string, ExpressMiddleware],
      ];
      middleware(request, response, next);
      // Then
      expect(sut).toBe(routerMessage);
      expect(next).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledTimes(1);
      expect(router.all).toHaveBeenCalledWith('/:version/*', expect.any(Function));
    });
  });
});
