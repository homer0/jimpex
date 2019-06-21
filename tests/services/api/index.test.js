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
    const expectedServices = {
      apiClient: expect.any(Function),
    };
    const expectedServicesNames = Object.keys(expectedServices);
    // When
    apiServices.register(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServicesNames.length);
    expectedServicesNames.forEach((service, index) => {
      const [registeredService] = app.register.mock.calls[index];
      expect(registeredService).toEqual(expectedServices[service]);
      expect(registeredService.toString()).toBe(apiServices[service].toString());
    });
  });
});
