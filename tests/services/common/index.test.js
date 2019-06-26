jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/common');

require('jasmine-expect');
const commonServices = require('/src/services/common');

describe('services:common', () => {
  it('should export a method to register all the API services', () => {
    // Given
    const app = {
      register: jest.fn(),
    };
    const expectedServices = [
      'appError',
      'httpError',
      'sendFile',
    ];
    // When
    commonServices.register(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service, index) => {
      const registeredService = app.register.mock.calls[index][0];
      expect(registeredService).toEqual({
        register: expect.any(Function),
        provider: true,
      });
      expect(registeredService.toString()).toBe(commonServices[service].toString());
    });
  });
});
