jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/utils');

require('jasmine-expect');
const utilsServices = require('/src/services/utils');

describe('services:utils', () => {
  it('should export a method to register all the API services', () => {
    // Given
    const app = {
      register: jest.fn(),
    };
    const expectedServices = {
      ensureBearerToken: expect.any(Function),
    };
    const expectedServicesNames = Object.keys(expectedServices);
    // When
    utilsServices.register(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServicesNames.length);
    expectedServicesNames.forEach((service, index) => {
      const [registeredService] = app.register.mock.calls[index];
      expect(registeredService).toEqual(expectedServices[service]);
      expect(registeredService.toString()).toBe(utilsServices[service].toString());
    });
  });
});
