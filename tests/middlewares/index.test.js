jest.mock('/src/utils/wrappers', () => ({
  middleware: (connect) => connect,
}));
jest.unmock('/src/middlewares');

require('jasmine-expect');
const middlewares = require('/src/middlewares');

describe('middlewares', () => {
  it('should export all the app middlewares', () => {
    // Given
    const knownMiddlewares = [
      'common',
      'html',
      'utils',
    ];
    // When/Then
    expect(Object.keys(middlewares).length).toBe(knownMiddlewares.length);
    knownMiddlewares.forEach((name) => {
      expect(middlewares[name]).toBeObject();
      const modules = Object.keys(middlewares[name]);
      modules.forEach((mod) => expect(middlewares[name][mod]).toBeFunction());
    });
  });
});
