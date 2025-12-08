import {
  HSTS,
  hstsMiddleware,
  type HSTSMiddlewarePartialOptions,
} from '@src/middlewares/common/hsts.js';
import type { Request, Response } from '@src/types/index.js';
import { getJimpexMock } from '@tests/mocks/index.js';

describe('middlewares/common:hsts', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given/When
      const sut = new HSTS();
      // Then
      expect(sut).toBeInstanceOf(HSTS);
      expect(sut.options).toEqual({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: false,
      });
      expect(sut.header).toBe('max-age=31536000; includeSubDomains');
    });

    it('should be instantiated with custom options', () => {
      // Given
      const options: HSTSMiddlewarePartialOptions = {
        maxAge: 12,
        includeSubDomains: false,
        preload: true,
      };
      // When
      const sut = new HSTS(options);
      // Then
      expect(sut.options).toEqual(options);
      expect(sut.header).toBe(`max-age=${options.maxAge}; preload`);
    });

    describe('middleware', () => {
      it('should add the header', () => {
        // Given
        const request = {} as unknown as Request;
        const setHeader = jest.fn();
        const response = {
          setHeader,
        } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new HSTS();
        sut.getMiddleware()(request, response, next);
        // Then
        expect(setHeader).toHaveBeenCalledTimes(1);
        expect(setHeader).toHaveBeenCalledWith(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
        );
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('middleware', () => {
    it("shouldn't return anything if not enabled", () => {
      // Given
      const config = {
        get: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      const sut = hstsMiddleware.connect(container);
      // Then
      expect(sut).toBeUndefined();
      expect(mocks.get).toHaveBeenCalledTimes(1);
      expect(mocks.get).toHaveBeenCalledWith('config');
    });

    it('should return the middleware when enabled', () => {
      // Given
      const config = {
        get: jest.fn(() => ({
          enabled: true,
        })),
      };
      const { container } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      const sut = hstsMiddleware.connect(container);
      const toCompare = new HSTS();
      // Then
      expect(sut!.toString()).toBe(toCompare.getMiddleware().toString());
    });

    it('should disable it from the options', () => {
      // Given
      const config = {
        get: jest.fn(() => ({
          enabled: true,
        })),
      };
      const { container } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      const sut = hstsMiddleware({
        enabled: false,
      }).connect(container);
      // Then
      expect(sut).toBeUndefined();
    });
  });
});
