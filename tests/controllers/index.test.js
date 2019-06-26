jest.unmock('/src/utils/wrappers');
jest.unmock('/src/controllers');

require('jasmine-expect');
const controllers = require('/src/controllers');

describe('controllers', () => {
  it('should export all the app controllers', () => {
    // Given
    const knownControllers = [
      'common',
      'utils',
    ];
    // When/Then
    expect(Object.keys(controllers).length).toBe(knownControllers.length);
    knownControllers.forEach((name) => {
      expect(controllers[name]).toBeObject();
    });
  });
});
