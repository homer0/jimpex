jest.unmock('/src/utils/wrappers');
jest.mock('wootils/shared/jimpleFns');

require('jasmine-expect');
const {
  controller,
  controllerCreator,
  middleware,
  middlewareCreator,
} = require('/src/utils/wrappers');
const { resource, resourceCreator } = require('wootils/shared/jimpleFns');

describe('utils/wrappers', () => {
  describe('controller', () => {
    beforeEach(() => {
      resource.mockReset();
      resourceCreator.mockReset();
    });

    it('should create a route controller', () => {
      // Given
      const routeController = 'routeController';
      resource.mockImplementationOnce((_, __, fn) => fn);
      let result = null;
      // When
      result = controller(routeController);
      // Then
      expect(result).toBe(routeController);
      expect(resource).toHaveBeenCalledTimes(1);
      expect(resource).toHaveBeenCalledWith('controller', 'connect', routeController);
    });

    it('should create a route controller creator', () => {
      // Given
      const routeController = 'routeController';
      resourceCreator.mockImplementationOnce((_, __, fn) => fn);
      let result = null;
      // When
      result = controllerCreator(routeController);
      // Then
      expect(result).toBe(routeController);
      expect(resourceCreator).toHaveBeenCalledTimes(1);
      expect(resourceCreator).toHaveBeenCalledWith('controller', 'connect', routeController);
    });
  });

  describe('middleware', () => {
    beforeEach(() => {
      resource.mockReset();
      resourceCreator.mockReset();
    });

    it('should create a route middleware', () => {
      // Given
      const appMiddleware = 'appMiddleware';
      resource.mockImplementationOnce((_, __, fn) => fn);
      let result = null;
      // When
      result = middleware(appMiddleware);
      // Then
      expect(result).toBe(appMiddleware);
      expect(resource).toHaveBeenCalledTimes(1);
      expect(resource).toHaveBeenCalledWith('middleware', 'connect', appMiddleware);
    });

    it('should create a route middleware creator', () => {
      // Given
      const appMiddleware = 'appMiddleware';
      resourceCreator.mockImplementationOnce((_, __, fn) => fn);
      let result = null;
      // When
      result = middlewareCreator(appMiddleware);
      // Then
      expect(result).toBe(appMiddleware);
      expect(resourceCreator).toHaveBeenCalledTimes(1);
      expect(resourceCreator).toHaveBeenCalledWith('middleware', 'connect', appMiddleware);
    });
  });
});
