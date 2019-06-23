jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/http');

require('jasmine-expect');
const httpServices = require('/src/services/http');

describe('services:http', () => {
  it('should export a method to register all the HTTP services', () => {
    // Given
    const app = {
      register: jest.fn(),
    };
    const expectedServices = {
      apiClient: expect.any(Function),
      http: {
        register: expect.any(Function),
        provider: true,
      },
      responsesBuilder: {
        register: expect.any(Function),
        provider: true,
      },
    };
    const expectedServicesNames = Object.keys(expectedServices);
    // When
    httpServices.register(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServicesNames.length);
    expectedServicesNames.forEach((service, index) => {
      const [registeredService] = app.register.mock.calls[index];
      expect(registeredService).toEqual(expectedServices[service]);
      expect(registeredService.toString()).toBe(httpServices[service].toString());
    });
  });
});
