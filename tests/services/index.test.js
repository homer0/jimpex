jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services');

require('jasmine-expect');
const services = require('/src/services');

describe('services', () => {
  it('should export all the app sevices', () => {
    // Given
    const knownServices = [
      'common',
      'frontend',
      'html',
      'http',
      'utils',
    ];
    // When/Then
    expect(Object.keys(services).length).toBe(knownServices.length);
    knownServices.forEach((name) => {
      expect(services[name]).toBeObject();
    });
  });
});
