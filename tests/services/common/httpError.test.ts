import { describe, it, expect } from 'vitest';
import { statuses } from '@src/utils/fns/statuses.js';
import {
  HTTPError,
  createHTTPError,
  httpErrorProvider,
} from '@src/services/common/httpError.js';
import { getJimpexMock } from '@tests/mocks/index.js';

describe('services/common:appError', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const message = 'Something went wrong!';
      // When
      const sut = new HTTPError(message);
      // Then
      expect(sut).toBeInstanceOf(HTTPError);
      expect(sut).toBeInstanceOf(Error);
      expect(sut.message).toBe(message);
      expect(sut.status).toBe(statuses('ok'));
    });

    it('should be instantiated with a custom status', () => {
      // Given
      const message = 'Something went wrong with a request!';
      const status = statuses('conflict');
      // When
      const sut = new HTTPError(message, status);
      // Then
      expect(sut.message).toBe(message);
      expect(sut.status).toEqual(status);
    });

    it('should be instantiated with context information', () => {
      // Given
      const message = 'Something went wrong!';
      const status = statuses('bad request');
      const context = {
        age: 6,
        name: 'Rosario',
      };
      // When
      const sut = new HTTPError(message, status, context);
      // Then
      expect(sut.message).toBe(message);
      expect(sut.context).toEqual({
        ...context,
        status,
      });
    });
  });

  describe('generator', () => {
    it('should generate a new instance', () => {
      // Given
      const message = 'Something went wrong!';
      const status = statuses('bad request');
      const context = {
        age: 2,
        name: 'Pilar',
        response: 'Something in case a response needs to be generated',
      };
      // When
      const sut = createHTTPError(message, status, context);
      // Then
      expect(sut.message).toBe(message);
      expect(sut.context).toEqual({
        ...context,
        status,
      });
      expect(sut.response).toEqual(context.response);
      expect(sut.status).toBe(status);
    });
  });

  describe('provider', () => {
    it('should register the class and the generator', () => {
      // Given
      const { container, containerMocks: mocks } = getJimpexMock();
      // When
      httpErrorProvider.register(container);
      const [[, lazyOne], [, lazyTwo]] = mocks.set.mock.calls as [
        [string, () => typeof HTTPError],
        [string, () => typeof createHTTPError],
      ];
      const resultOne = lazyOne();
      const resultTwo = lazyTwo();
      // Then
      expect(resultOne).toBe(HTTPError);
      expect(resultTwo).toBe(createHTTPError);
      expect(mocks.set).toHaveBeenCalledTimes(2);
      expect(mocks.set).toHaveBeenNthCalledWith(1, 'HTTPError', expect.any(Function));
      expect(mocks.set).toHaveBeenNthCalledWith(2, 'httpError', expect.any(Function));
    });
  });
});
