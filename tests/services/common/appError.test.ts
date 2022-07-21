jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/utils/index');
jest.unmock('../../../src/utils/fns/index');
jest.unmock('../../../src/utils/fns/statuses');
jest.unmock('../../../src/services/common/appError');

import { Jimpex } from '../../../src/app';
import { statuses, type Statuses } from '../../../src/utils/fns/statuses';
import {
  AppError,
  createAppError,
  appErrorProvider,
} from '../../../src/services/common/appError';

const originalCaptureStackTrace = Error.captureStackTrace;

describe('services/common:appError', () => {
  describe('class', () => {
    afterEach(() => {
      Error.captureStackTrace = originalCaptureStackTrace;
    });

    it('should be instantiated', () => {
      // Given
      const message = 'Something went wrong!';
      // When
      const sut = new AppError(message);
      // Then
      expect(sut).toBeInstanceOf(AppError);
      expect(sut).toBeInstanceOf(Error);
      expect(sut.message).toBe(message);
      expect(sut.date).toBeInstanceOf(Date);
      expect(sut.response).toEqual({});
      expect(sut.status).toBeUndefined();
    });

    it('should be instantiated with context information', () => {
      // Given
      const message = 'Something went wrong!';
      const context = {
        age: 6,
        name: 'Rosario',
        response: 'Something in case a response needs to be generated',
        status: 500,
      };
      // When
      const sut = new AppError(message, context);
      const response = sut.getResponse();
      // Then
      expect(sut.message).toBe(message);
      expect(sut.context).toEqual(context);
      expect(sut.response).toEqual(context.response);
      expect(response).toEqual(context.response);
      expect(sut.status).toEqual(context.status);
    });

    it('should format a status code sent as string', () => {
      // Given
      const message = 'Something went wrong!';
      const context = {
        status: 'internal server error',
      };
      // When
      const sut = new AppError(message, context);
      // Then
      expect(sut).toBeInstanceOf(AppError);
      expect(sut.status).toBe(statuses(context.status));
    });

    it('should use a custom version of `statuses`', () => {
      // Given
      const message = 'Something went wrong!';
      const context = {
        status: 'internal server error',
      };
      const fakeStatus = 440;
      const statusesMock = {
        code: {
          [context.status]: fakeStatus,
        },
      } as unknown as Statuses;
      // When
      const sut = new AppError(message, context, statusesMock);
      // Then
      expect(sut).toBeInstanceOf(AppError);
      expect(sut.status).toBe(fakeStatus);
    });

    it("shouldn't format a status code sent as string if is not a valid status", () => {
      // Given
      const message = 'Something went wrong!';
      const context = {
        status: 'wooo',
      };
      // When
      const sut = new AppError(message, context);
      // Then
      expect(sut.status).toBe(context.status);
    });

    it('should use `captureStackTrace` when avaiable', () => {
      // Given
      const captureStackTrace = jest.fn();
      Error.captureStackTrace = captureStackTrace;
      // When
      const sut = new AppError('With stack trace');
      // @ts-expect-error - This is a mock
      Error.captureStackTrace = null;
      // eslint-disable-next-line no-new
      new AppError('Without stack trace');
      // Then
      expect(captureStackTrace).toHaveBeenCalledTimes(1);
      expect(captureStackTrace).toHaveBeenCalledWith(sut, sut.constructor);
    });
  });

  describe('generator', () => {
    it('should generate a new instance', () => {
      // Given
      const message = 'Something went wrong!';
      const context = {
        age: 2,
        name: 'Pilar',
        response: 'Something in case a response needs to be generated',
        status: 500,
      };
      // When
      const sut = createAppError(message, context);
      // Then
      expect(sut.message).toBe(message);
      expect(sut.context).toEqual(context);
      expect(sut.response).toEqual(context.response);
      expect(sut.status).toEqual(context.status);
    });
  });

  describe('provider', () => {
    it('should register the class and the generator', () => {
      // Given
      const setFn = jest.fn();
      class Container extends Jimpex {
        override set(...args: Parameters<Jimpex['set']>): ReturnType<Jimpex['set']> {
          setFn(...args);
          return super.set(...args);
        }
      }
      const container = new Container();
      // When
      appErrorProvider.register(container);
      const [[, lazyOne], [, lazyTwo]] = setFn.mock.calls;
      const resultOne = lazyOne();
      const resultTwo = lazyTwo();
      // Then
      expect(resultOne).toBe(AppError);
      expect(resultTwo).toBe(createAppError);
      expect(setFn).toHaveBeenCalledTimes(2);
      expect(setFn).toHaveBeenNthCalledWith(1, 'AppError', expect.any(Function));
      expect(setFn).toHaveBeenNthCalledWith(2, 'appError', expect.any(Function));
    });
  });
});
