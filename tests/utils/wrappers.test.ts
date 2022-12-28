import { Jimpex } from '@src/app/jimpex';
import {
  controller,
  controllerCreator,
  controllerProvider,
  controllerProviderCreator,
  middleware,
  middlewareCreator,
  middlewareProvider,
  middlewareProviderCreator,
} from '@src/utils/wrappers';

describe('app:resources', () => {
  describe('controllers', () => {
    it('should generate an object with a `connect` function', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const jimpex = new Jimpex();
      const route = '/some/path';
      // When
      const sut = controller(connect);
      const result = sut.connect(jimpex, route);
      // Then
      expect(sut).toEqual({
        controller: true,
        connect: expect.any(Function),
      });
      expect(result).toBe(handler);
      expect(connect).toHaveBeenCalledWith(jimpex, route);
    });

    it('should generate a controller creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const creator = jest.fn(() => connect);
      const jimpex = new Jimpex();
      const route = '/some/path';
      // When
      const sut = controllerCreator(creator);
      const result = sut();
      const resultFromCreator = result.connect(jimpex, route);
      const resultAsController = sut.connect(jimpex, route);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.controller).toBe(true);
      expect(sut.connect).toBe(connect);
      expect(resultFromCreator).toBe(handler);
      expect(resultAsController).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledWith(jimpex, route);
    });

    it('should generate a controller provider', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => controller(connect));
      const jimpex = new Jimpex();
      const route = '/some/path';
      // When
      const sut = controllerProvider(register);
      const result = sut.register(jimpex, route);
      const connectResult = result.connect(jimpex, route);
      // Then
      expect(sut).toEqual({
        provider: true,
        register: expect.any(Function),
      });
      expect(result).toEqual({
        controller: true,
        connect,
      });
      expect(connectResult).toBe(handler);
    });

    it('should generate a controller provider creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => controller(connect));
      const creator = jest.fn(() => register);
      const jimpex = new Jimpex();
      const route = '/some/path';
      // When
      const sut = controllerProviderCreator(creator);
      const resultFromCreator = sut().register(jimpex, route);
      const resultAsProvider = sut.register(jimpex, route);
      const connectResultFromCreator = resultFromCreator.connect(jimpex, route);
      const connectResultAsProvider = resultAsProvider.connect(jimpex, route);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.provider).toBe(true);
      expect(sut.register).toBe(register);
      expect(resultFromCreator).toEqual({
        controller: true,
        connect,
      });
      expect(resultAsProvider).toEqual({
        controller: true,
        connect,
      });
      expect(connectResultFromCreator).toBe(handler);
      expect(connectResultAsProvider).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
    });
  });
  describe('middlewares', () => {
    it('should generate an object with a `connect` function', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const jimpex = new Jimpex();
      // When
      const sut = middleware(connect);
      const result = sut.connect(jimpex);
      // Then
      expect(sut).toEqual({
        middleware: true,
        connect: expect.any(Function),
      });
      expect(result).toBe(handler);
      expect(connect).toHaveBeenCalledWith(jimpex);
    });

    it('should generate a middleware creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const creator = jest.fn(() => connect);
      const jimpex = new Jimpex();
      // When
      const sut = middlewareCreator(creator);
      const result = sut();
      const resultFromCreator = result.connect(jimpex);
      const resultAsMiddleware = sut.connect(jimpex);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.middleware).toBe(true);
      expect(sut.connect).toBe(connect);
      expect(resultFromCreator).toBe(handler);
      expect(resultAsMiddleware).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledWith(jimpex);
    });

    it('should generate a middleware provider', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => middleware(connect));
      const jimpex = new Jimpex();
      // When
      const sut = middlewareProvider(register);
      const result = sut.register(jimpex);
      const connectResult = result.connect(jimpex);
      // Then
      expect(sut).toEqual({
        provider: true,
        register: expect.any(Function),
      });
      expect(result).toEqual({
        middleware: true,
        connect,
      });
      expect(connectResult).toBe(handler);
    });

    it('should generate a middleware provider creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => middleware(connect));
      const creator = jest.fn(() => register);
      const jimpex = new Jimpex();
      // When
      const sut = middlewareProviderCreator(creator);
      const resultFromCreator = sut().register(jimpex);
      const resultAsProvider = sut.register(jimpex);
      const connectResultFromCreator = resultFromCreator.connect(jimpex);
      const connectResultAsProvider = resultAsProvider.connect(jimpex);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.provider).toBe(true);
      expect(sut.register).toBe(register);
      expect(resultFromCreator).toEqual({
        middleware: true,
        connect,
      });
      expect(resultAsProvider).toEqual({
        middleware: true,
        connect,
      });
      expect(connectResultFromCreator).toBe(handler);
      expect(connectResultAsProvider).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
    });
  });
});
