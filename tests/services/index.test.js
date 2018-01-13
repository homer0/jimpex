const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services');

require('jasmine-expect');
const services = require('/src/services');

describe('services', () => {
  it('should export all the app sevices', () => {
    // Given
    const knownServices = [
      'api',
      'common',
      'frontend',
      'html',
      'http',
    ];
    // When/Then
    expect(Object.keys(services).length).toBe(knownServices.length);
    knownServices.forEach((name) => {
      expect(services[name]).toBeObject();
      const modules = Object.keys(services[name]);
      modules.forEach((mod) => expect(services[name][mod]).toBeFunction());
    });
  });
});
