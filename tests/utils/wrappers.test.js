jest.unmock('/src/utils/wrappers');

require('jasmine-expect');
const {
  provider,
  providerCreator,
  controller,
  controllerCreator,
  middleware,
  middlewareCreator,
} = require('/src/utils/wrappers');

describe('utils/wrappers', () => {
  describe('provider', () => {
    it('should create a service provider with a `register` function', () => {
      // Given
      const serviceProvider = 'serviceProvider';
      let result = null;
      // When
      result = provider(serviceProvider);
      // Then
      expect(result).toEqual({
        register: serviceProvider,
      });
    });

    it('should create a service provider creator', () => {
      // Given
      const serviceProvider = 'serviceProvider';
      const creatorFn = jest.fn(() => serviceProvider);
      const options = 'options';
      let creator = null;
      let result = null;
      // When
      creator = providerCreator(creatorFn);
      result = creator(options);
      // Then
      expect(result).toEqual({
        register: serviceProvider,
      });
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith(options);
    });

    it('should create a service provider creator that can be used without options', () => {
      // Given
      const serviceProvider = 'serviceProvider';
      const creatorFn = jest.fn(() => serviceProvider);
      let creator = null;
      // When
      creator = providerCreator(creatorFn);
      // Then
      expect(creator.register).toBe(serviceProvider);
      expect(creator.anyOtherProp).toBeUndefined(); // to validate the getter.
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith();
    });

    it('should create a service provider with default options just once', () => {
      // Given
      const serviceProvider = 'serviceProvider';
      const creatorFn = jest.fn(() => serviceProvider);
      let creator = null;
      // When
      creator = providerCreator(creatorFn);
      // Then
      expect(creator.register).toBe(serviceProvider);
      expect(creator.register).toBe(serviceProvider); // this is the second trigger for the proxy.
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith();
    });
  });

  describe('controller', () => {
    it('should create a route controller with a `connect` function', () => {
      // Given
      const routeController = 'routeController';
      let result = null;
      // When
      result = controller(routeController);
      // Then
      expect(result).toEqual({
        connect: routeController,
      });
    });

    it('should create a route controller creator', () => {
      // Given
      const routeController = 'routeController';
      const creatorFn = jest.fn(() => routeController);
      const options = 'options';
      let creator = null;
      let result = null;
      // When
      creator = controllerCreator(creatorFn);
      result = creator(options);
      // Then
      expect(result).toEqual({
        connect: routeController,
      });
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith(options);
    });

    it('should create a route controller creator that can be used without options', () => {
      // Given
      const routeController = 'routeController';
      const creatorFn = jest.fn(() => routeController);
      let creator = null;
      // When
      creator = controllerCreator(creatorFn);
      // Then
      expect(creator.connect).toBe(routeController);
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith();
    });
  });

  describe('middleware', () => {
    it('should create a route middleware with a `connect` function', () => {
      // Given
      const appMiddleware = 'appMiddleware';
      let result = null;
      // When
      result = middleware(appMiddleware);
      // Then
      expect(result).toEqual({
        connect: appMiddleware,
      });
    });

    it('should create a route middleware creator', () => {
      // Given
      const appMiddleware = 'appMiddleware';
      const creatorFn = jest.fn(() => appMiddleware);
      const options = 'options';
      let creator = null;
      let result = null;
      // When
      creator = middlewareCreator(creatorFn);
      result = creator(options);
      // Then
      expect(result).toEqual({
        connect: appMiddleware,
      });
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith(options);
    });

    it('should create a route middleware creator that can be used without options', () => {
      // Given
      const appMiddleware = 'appMiddleware';
      const creatorFn = jest.fn(() => appMiddleware);
      let creator = null;
      // When
      creator = middlewareCreator(creatorFn);
      // Then
      expect(creator.connect).toBe(appMiddleware);
      expect(creatorFn).toHaveBeenCalledTimes(1);
      expect(creatorFn).toHaveBeenCalledWith();
    });
  });
});
