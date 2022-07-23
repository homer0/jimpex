/* eslint-disable dot-notation */
import {
  EnsureBearerToken,
  ensureBearerTokenProvider,
  type EnsureBearerConstructorOptions,
} from '@src/services/utils/ensureBearerToken';
import { HTTPError } from '@src/services/common/httpError';
import type { Request, Response } from '@src/types';
import { statuses as realStatuses, type Statuses } from '@src/utils/fns/statuses';
import { getJimpexMock } from '@tests/mocks';

describe('services/utils:ensureBearerToken', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const status = 401;
      const statuses = jest.fn(() => status);
      const options: EnsureBearerConstructorOptions = {
        inject: {
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
      };
      // When
      const sut = new EnsureBearerToken(options);
      // Then
      expect(sut).toBeInstanceOf(EnsureBearerToken);
      expect(sut.getOptions()).toEqual({
        error: {
          message: 'Unauthorized',
          status,
          response: {},
        },
        expression: /bearer (.*?)(?:$|\s)/i,
        local: 'token',
      });
      expect(statuses).toHaveBeenCalledTimes(1);
      expect(statuses).toHaveBeenCalledWith('unauthorized');
    });

    it('should be instantiated with custom options', () => {
      // Given
      const status = realStatuses('unauthorized');
      const statuses = jest.fn(() => status);
      const options: EnsureBearerConstructorOptions = {
        inject: {
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
        error: {
          message: 'Nop!',
        },
        local: 'token',
      };
      // When
      const sut = new EnsureBearerToken(options);
      // Then
      expect(sut).toBeInstanceOf(EnsureBearerToken);
      expect(sut.getOptions()).toEqual({
        error: {
          message: options.error!.message,
          status,
          response: {},
        },
        expression: /bearer (.*?)(?:$|\s)/i,
        local: options.local!,
      });
    });

    describe('middleware', () => {
      it('should authorize a request with a token', () => {
        // Given
        const statuses = jest.fn();
        const options: EnsureBearerConstructorOptions = {
          inject: {
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
        };
        const token = 'abc';
        const request = {
          headers: {
            authorization: `Bearer ${token}`,
          },
        } as unknown as Request;
        const response = { locals: {} } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new EnsureBearerToken(options);
        sut.middleware()(request, response, next);
        // Then
        expect(response.locals['token']).toBe(token);
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      it('should send an error when the token is not present', () => {
        // Given
        const status = realStatuses('bad request');
        const statuses = jest.fn();
        const errorOptions = {
          message: 'Nop',
          status: status as number,
          response: {
            unauthorized: true,
          },
        };
        const options: EnsureBearerConstructorOptions = {
          inject: {
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          error: errorOptions,
        };
        const request = {
          headers: {},
        } as unknown as Request;
        const response = { locals: {} } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new EnsureBearerToken(options);
        sut.middleware()(request, response, next);
        // Then
        expect(response.locals['token']).toBeUndefined();
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          new HTTPError(errorOptions.message, errorOptions.status, {
            response: errorOptions.response,
          }),
        );
      });

      it("should send an error if the header doesn't match the expression", () => {
        // Given
        const status = realStatuses('bad request');
        const statuses = jest.fn();
        const errorOptions = {
          message: 'Nop',
          status: status as number,
          response: {
            unauthorized: true,
          },
        };
        const options: EnsureBearerConstructorOptions = {
          inject: {
            HTTPError,
            statuses: statuses as unknown as Statuses,
          },
          error: errorOptions,
        };
        const request = {
          headers: {
            authorization: 'Nop',
          },
        } as unknown as Request;
        const response = { locals: {} } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new EnsureBearerToken(options);
        sut.middleware()(request, response, next);
        // Then
        expect(response.locals['token']).toBeUndefined();
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          new HTTPError(errorOptions.message, errorOptions.status, {
            response: errorOptions.response,
          }),
        );
      });
    });
  });

  describe('provider', () => {
    it('should register the service', () => {
      // Given
      const statuses = jest.fn(() => 401);
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          statuses,
        },
      });
      // When
      ensureBearerTokenProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => EnsureBearerToken]];
      const result = lazy();
      const toCompare = new EnsureBearerToken({
        inject: {
          HTTPError,
          statuses: statuses as unknown as Statuses,
        },
      });
      // Then
      expect(result).toEqual(expect.any(Function));
      expect(result.toString()).toEqual(toCompare.middleware().toString());
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('ensureBearerToken', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(2);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'HTTPError');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'statuses');
    });

    it('should register the service with custom options', () => {
      // Given
      const statuses = jest.fn(() => 401);
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          statuses,
        },
      });
      const serviceName = 'myEnsureBearerToken';
      // When
      ensureBearerTokenProvider({ serviceName }).register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => EnsureBearerToken]];
      lazy();
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith(serviceName, expect.any(Function));
    });
  });
});
