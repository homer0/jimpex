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
import { getJimpexMock } from '@tests/mocks';

describe('app:wrappers', () => {
  describe('controllers', () => {
    it('should generate an object with a `connect` function', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const { container } = getJimpexMock();
      const route = '/some/path';
      // When
      const sut = controller(connect);
      const result = sut.connect(container, route);
      // Then
      expect(sut).toEqual({
        controller: true,
        connect: expect.any(Function),
      });
      expect(result).toBe(handler);
      expect(connect).toHaveBeenCalledWith(container, route);
    });

    it('should generate a controller creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const creator = jest.fn(() => connect);
      const { container } = getJimpexMock();
      const route = '/some/path';
      // When
      const sut = controllerCreator(creator);
      const result = sut();
      const resultFromCreator = result.connect(container, route);
      const resultAsController = sut.connect(container, route);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.controller).toBe(true);
      expect(sut.connect).toBe(connect);
      expect(resultFromCreator).toBe(handler);
      expect(resultAsController).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledWith(container, route);
    });

    it('should generate a controller provider', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => controller(connect));
      const { container } = getJimpexMock();
      const route = '/some/path';
      // When
      const sut = controllerProvider(register);
      const result = sut.register(container, route);
      const connectResult = result.connect(container, route);
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
      const { container } = getJimpexMock();
      const route = '/some/path';
      // When
      const sut = controllerProviderCreator(creator);
      const resultFromCreator = sut().register(container, route);
      const resultAsProvider = sut.register(container, route);
      const connectResultFromCreator = resultFromCreator.connect(container, route);
      const connectResultAsProvider = resultAsProvider.connect(container, route);
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
      const { container } = getJimpexMock();
      // When
      const sut = middleware(connect);
      const result = sut.connect(container);
      // Then
      expect(sut).toEqual({
        middleware: true,
        connect: expect.any(Function),
      });
      expect(result).toBe(handler);
      expect(connect).toHaveBeenCalledWith(container);
    });

    it('should generate a middleware creator', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const creator = jest.fn(() => connect);
      const { container } = getJimpexMock();
      // When
      const sut = middlewareCreator(creator);
      const result = sut();
      const resultFromCreator = result.connect(container);
      const resultAsMiddleware = sut.connect(container);
      // Then
      expect(sut).toEqual(expect.any(Function));
      expect(sut.middleware).toBe(true);
      expect(sut.connect).toBe(connect);
      expect(resultFromCreator).toBe(handler);
      expect(resultAsMiddleware).toBe(handler);
      expect(creator).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledWith(container);
    });

    it('should generate a middleware provider', () => {
      // Given
      const handler = () => {};
      const connect = jest.fn(() => handler);
      const register = jest.fn(() => middleware(connect));
      const { container } = getJimpexMock();
      // When
      const sut = middlewareProvider(register);
      const result = sut.register(container);
      const connectResult = result.connect(container);
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
      const { container } = getJimpexMock();
      // When
      const sut = middlewareProviderCreator(creator);
      const resultFromCreator = sut().register(container);
      const resultAsProvider = sut.register(container);
      const connectResultFromCreator = resultFromCreator.connect(container);
      const connectResultAsProvider = resultAsProvider.connect(container);
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
