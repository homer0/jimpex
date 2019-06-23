jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/http');

require('jasmine-expect');
const httpServices = require('/src/services/http');

describe('services:http', () => {
  it('should export a method to register all the API services', () => {
    // Given
    const app = {
      register: jest.fn(),
    };
    const expectedServices = [
      'http',
      'responsesBuilder',
    ];
    // When
    httpServices.register(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service, index) => {
      const registeredService = app.register.mock.calls[index][0];
      expect(registeredService).toEqual({
        register: expect.any(Function),
        provider: true,
      });
      expect(registeredService.toString()).toBe(httpServices[service].toString());
    });
  });
});
