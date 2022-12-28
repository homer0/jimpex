import {
  ErrorHandler,
  errorHandlerMiddleware,
  type ErrorHandlerConstructorOptions,
} from '@src/middlewares/common/errorHandler';
import { AppError, HTTPError, ResponsesBuilder } from '@src/services';
import type { ExpressErrorHandler, Request, Response } from '@src/types';
import { statuses as realStatuses, type Statuses } from '@src/utils';
import { getJimpexMock, getLoggerMock } from '@tests/mocks';

describe('middlewares/common:errorHandler', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const status = realStatuses('internal server error');
      const statuses = jest.fn(() => status);
      const { logger } = getLoggerMock();
      const responsesBuilder = {} as ResponsesBuilder;
      const options: ErrorHandlerConstructorOptions = {
        inject: {
          logger,
          responsesBuilder,
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
      };
      // When
      const sut = new ErrorHandler(options);
      // Then
      expect(sut).toBeInstanceOf(ErrorHandler);
      expect(sut.getOptions()).toEqual({
        showErrors: false,
        response: {
          message: 'Unexpected error',
          status,
        },
      });
      expect(statuses).toHaveBeenCalledTimes(1);
      expect(statuses).toHaveBeenCalledWith('internal server error');
    });

    it('should be instantiated with custom options', () => {
      // Given
      const statuses = jest.fn();
      const { logger } = getLoggerMock();
      const responsesBuilder = {} as ResponsesBuilder;
      const customOptions = {
        showErrors: true,
        response: {
          message: 'Nop!',
          status: realStatuses('not found') as number,
        },
      };
      const options: ErrorHandlerConstructorOptions = {
        inject: {
          logger,
          responsesBuilder,
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
        ...customOptions,
      };
      // When
      const sut = new ErrorHandler(options);
      // Then
      expect(sut).toBeInstanceOf(ErrorHandler);
      expect(sut.getOptions()).toEqual(customOptions);
    });

    describe('middleware', () => {
      it("shouldn't do anything if the error is falsy", () => {
        // Given
        const error = null;
        const status = realStatuses('internal server error');
        const statuses = jest.fn(() => status);
        const defaultMessage = 'Unexpected error';
        const { logger } = getLoggerMock();
        const responsesBuilder = {
          json: jest.fn(),
        } as unknown as ResponsesBuilder;
        const options: ErrorHandlerConstructorOptions = {
          inject: {
            logger,
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          response: {
            message: defaultMessage,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ErrorHandler(options);
        sut.middleware()(error, request, response, next);
        // Then
        expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it('should format an error and hide its real information', () => {
        // Given
        const error = new Error('Nop!');
        const status = realStatuses('internal server error');
        const statuses = jest.fn(() => status);
        const defaultMessage = 'Unexpected error';
        const { logger } = getLoggerMock();
        const responsesBuilder = {
          json: jest.fn(),
        } as unknown as ResponsesBuilder;
        const options: ErrorHandlerConstructorOptions = {
          inject: {
            logger,
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          response: {
            message: defaultMessage,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ErrorHandler(options);
        sut.middleware()(error, request, response, next);
        // Then
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            error: true,
            message: defaultMessage,
          },
        });
      });

      it('should format an error and show its real information', () => {
        // Given
        const error = new Error('Nop!');
        const status = realStatuses('internal server error');
        const statuses = jest.fn(() => status);
        const defaultMessage = 'Unexpected error';
        const { logger } = getLoggerMock();
        const responsesBuilder = {
          json: jest.fn(),
        } as unknown as ResponsesBuilder;
        const options: ErrorHandlerConstructorOptions = {
          inject: {
            logger,
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          showErrors: true,
          response: {
            message: defaultMessage,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ErrorHandler(options);
        sut.middleware()(error, request, response, next);
        // Then
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            error: true,
            message: error.message,
            stack: expect.any(Array),
          },
        });
      });

      it('should format an HTTPError and show its real information', () => {
        // Given
        const status = realStatuses('unauthorized');
        const errorResponse = {
          fromError: true,
        };
        const error = new HTTPError('Nop!', status, {
          response: errorResponse,
        });
        const statuses = jest.fn();
        const { logger } = getLoggerMock();
        const responsesBuilder = {
          json: jest.fn(),
        } as unknown as ResponsesBuilder;
        const options: ErrorHandlerConstructorOptions = {
          inject: {
            logger,
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          showErrors: true,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ErrorHandler(options);
        sut.middleware()(error, request, response, next);
        // Then
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            error: true,
            message: error.message,
            stack: expect.any(Array),
            ...errorResponse,
          },
        });
      });

      it('should format an AppError and show its real information', () => {
        // Given
        const error = new AppError('Nop!', {
          status: 0,
        });
        const status = realStatuses('bad request');
        const statuses = jest.fn(() => status);
        const { logger } = getLoggerMock();
        const responsesBuilder = {
          json: jest.fn(),
        } as unknown as ResponsesBuilder;
        const options: ErrorHandlerConstructorOptions = {
          inject: {
            logger,
            responsesBuilder,
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          showErrors: true,
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ErrorHandler(options);
        sut.middleware()(error, request, response, next);
        // Then
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            error: true,
            message: error.message,
            stack: expect.any(Array),
          },
        });
        expect(statuses).toHaveBeenCalledTimes(2);
        expect(statuses).toHaveBeenNthCalledWith(1, 'internal server error');
        expect(statuses).toHaveBeenNthCalledWith(2, 'bad request');
      });
    });
  });

  describe('middleware', () => {
    it('should configure it for the container and format an error', () => {
      // Given
      const error = new Error('Nop!');
      const config = {
        get: jest.fn(),
      };
      const status = realStatuses('unauthorized');
      const statuses = jest.fn(() => status);
      const { logger } = getLoggerMock();
      const responsesBuilder = {
        json: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          statuses,
          config,
          logger,
          responsesBuilder,
        },
      });
      const response = {
        response: true,
      } as unknown as Response;
      const request = {
        request: true,
      } as unknown as Request;
      const next = jest.fn();
      // When
      const sut = errorHandlerMiddleware.connect(container);
      (sut as ExpressErrorHandler)(error, request, response, next);
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(5);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'logger');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'responsesBuilder');
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'statuses');
      expect(mocks.get).toHaveBeenNthCalledWith(5, 'HTTPError');
      expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
      expect(responsesBuilder.json).toHaveBeenCalledWith({
        res: response,
        status,
        data: {
          error: true,
          message: expect.any(String),
        },
      });
    });

    it('should configure it for the container and format an error with its stack', () => {
      // Given
      const error = new Error('Nop!');
      const config = {
        get: jest.fn(() => true),
      };
      const status = realStatuses('unauthorized');
      const statuses = jest.fn(() => status);
      const { logger } = getLoggerMock();
      const responsesBuilder = {
        json: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          statuses,
          config,
          logger,
          responsesBuilder,
        },
      });
      const response = {
        response: true,
      } as unknown as Response;
      const request = {
        request: true,
      } as unknown as Request;
      const next = jest.fn();
      // When
      const sut = errorHandlerMiddleware.connect(container);
      (sut as ExpressErrorHandler)(error, request, response, next);
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(5);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'logger');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'responsesBuilder');
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'statuses');
      expect(mocks.get).toHaveBeenNthCalledWith(5, 'HTTPError');
      expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
      expect(responsesBuilder.json).toHaveBeenCalledWith({
        res: response,
        status,
        data: {
          error: true,
          message: expect.any(String),
          stack: expect.any(Array),
        },
      });
    });
  });
});
