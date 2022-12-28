import {
  ForceHTTPS,
  forceHTTPSMiddleware,
  type ForceHTTPSPartialOptions,
} from '@src/middlewares/common/forceHTTPS';
import type { Request, Response } from '@src/types';
import { getJimpexMock } from '@tests/mocks';

describe('middlewares/common:forceHTTPS', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given/When
      const sut = new ForceHTTPS();
      // Then
      expect(sut).toBeInstanceOf(ForceHTTPS);
      expect(sut.getOptions()).toEqual({
        ignoredRoutes: expect.arrayContaining([expect.any(RegExp)]),
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const ignoredRoutes = [/\/api\/.*/];
      const options: ForceHTTPSPartialOptions = {
        ignoredRoutes,
      };
      // When
      const sut = new ForceHTTPS(options);
      // Then
      expect(sut.getOptions()).toEqual({
        ignoredRoutes,
      });
    });

    describe('middleware', () => {
      it('should redirect the request to use HTTPS', () => {
        // Given
        const requestInfo = {
          secure: false,
          'X-Forwarded-Proto': 'http',
          Host: 'homer0.dev',
          url: '/index.html',
          originalUrl: '/index.html',
        };
        const requestGet = jest.fn((key) => requestInfo[key as keyof typeof requestInfo]);
        const request = {
          ...requestInfo,
          get: requestGet,
        } as unknown as Request;
        const redirect = jest.fn();
        const response = {
          redirect,
        } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new ForceHTTPS();
        sut.middleware()(request, response, next);
        // Then
        expect(requestGet).toHaveBeenCalledTimes(2);
        expect(requestGet).toHaveBeenNthCalledWith(1, 'X-Forwarded-Proto');
        expect(requestGet).toHaveBeenNthCalledWith(2, 'Host');
        expect(redirect).toHaveBeenCalledTimes(1);
        expect(redirect).toHaveBeenCalledWith(
          `https://${requestInfo.Host}${requestInfo.url}`,
        );
        expect(next).toHaveBeenCalledTimes(0);
      });

      it("shouldn't redirect a request that already uses HTTPS", () => {
        // Given
        const requestInfo = {
          secure: true,
          'X-Forwarded-Proto': 'https',
          Host: 'homer0.dev',
          url: '/index.html',
          originalUrl: '/index.html',
        };
        const requestGet = jest.fn((key) => requestInfo[key as keyof typeof requestInfo]);
        const request = {
          ...requestInfo,
          get: requestGet,
        } as unknown as Request;
        const redirect = jest.fn();
        const response = {
          redirect,
        } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new ForceHTTPS();
        sut.middleware()(request, response, next);
        // Then
        expect(requestGet).toHaveBeenCalledTimes(0);
        expect(redirect).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(1);
      });

      it("shouldn't redirect a request that matches the ignored routes", () => {
        // Given
        const ignoredRoutes = [/^\/index\.html$/];
        const requestInfo = {
          secure: false,
          'X-Forwarded-Proto': 'http',
          Host: 'homer0.dev',
          url: '/index.html',
          originalUrl: '/index.html',
        };
        const requestGet = jest.fn((key) => requestInfo[key as keyof typeof requestInfo]);
        const request = {
          ...requestInfo,
          get: requestGet,
        } as unknown as Request;
        const redirect = jest.fn();
        const response = {
          redirect,
        } as unknown as Response;
        const next = jest.fn();
        // When
        const sut = new ForceHTTPS({
          ignoredRoutes,
        });
        sut.middleware()(request, response, next);
        // Then
        expect(redirect).toHaveBeenCalledTimes(0);
        expect(next).toHaveBeenCalledTimes(1);
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
      const sut = forceHTTPSMiddleware.connect(container);
      // Then
      expect(sut).toBeUndefined();
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(1);
      expect(mocks.get).toHaveBeenCalledWith('config');
    });

    it('should return the middleware when enabled', () => {
      // Given
      const config = {
        get: jest.fn(() => true),
      };
      const { container } = getJimpexMock({
        resources: {
          config,
        },
      });
      // When
      const sut = forceHTTPSMiddleware.connect(container);
      const toCompare = new ForceHTTPS();
      // Then
      expect(sut!.toString()).toBe(toCompare.middleware().toString());
    });
  });
});
