const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.mock('/src/utils/wrappers', () => ({
  controller: (connect) => connect,
}));
jest.unmock('/src/controllers');

require('jasmine-expect');
const controllers = require('/src/controllers');

describe('controllers', () => {
  it('should export all the app controllers', () => {
    // Given
    const knownControllers = [
      'api',
      'common',
    ];
    // When/Then
    expect(Object.keys(controllers).length).toBe(knownControllers.length);
    knownControllers.forEach((name) => {
      expect(controllers[name]).toBeObject();
      const modules = Object.keys(controllers[name]);
      modules.forEach((mod) => expect(controllers[name][mod]).toBeFunction());
    });
  });
});
