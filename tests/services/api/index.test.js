const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/api');

require('jasmine-expect');
const apiServices = require('/src/services/api');

describe('services:api', () => {
  it('should export a method to register all the API services', () => {
    // Given
    const app = {
      register: jest.fn(),
    };
    const expectedServices = [
      'apiClient',
      'ensureBearerAuthentication',
      'versionValidator',
    ];
    // When
    apiServices.all(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service, index) => {
      const registeredService = app.register.mock.calls[index][0];
      expect(registeredService).toBeFunction();
      expect(registeredService.toString()).toBe(apiServices[service].toString());
    });
  });
});
