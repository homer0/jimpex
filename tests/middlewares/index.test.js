jest.unmock('../../src/utils/wrappers');
jest.unmock('../../src/middlewares');

const middlewares = require('../../src/middlewares');

describe('middlewares', () => {
  it('should export all the app middlewares', () => {
    // Given
    const knownMiddlewares = {
      common: ['errorHandler', 'forceHTTPS', 'hsts'],
      html: ['fastHTML', 'showHTML'],
      utils: ['versionValidator'],
    };
    const knownMiddlewaresModules = Object.keys(knownMiddlewares);
    // When/Then
    expect(Object.keys(middlewares).length).toBe(knownMiddlewaresModules.length);
    knownMiddlewaresModules.forEach((name) => {
      expect(Object.keys(middlewares[name])).toEqual(knownMiddlewares[name]);
    });
  });
});
