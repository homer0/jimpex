jest.unmock('../../src/utils/wrappers');
jest.unmock('../../src/controllers');

const controllers = require('../../src/controllers');

describe('controllers', () => {
  it('should export all the app controllers', () => {
    // Given
    const knownControllers = {
      common: [
        'configurationController',
        'healthController',
        'staticsController',
      ],
      utils: [
        'gatewayController',
      ],
    };
    const knownControllersModules = Object.keys(knownControllers);
    // When/Then
    expect(Object.keys(controllers).length).toBe(knownControllersModules.length);
    knownControllersModules.forEach((name) => {
      expect(Object.keys(controllers[name])).toEqual(knownControllers[name]);
    });
  });
});
