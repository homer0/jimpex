const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
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
    commonServices.all(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service, index) => {
      const registeredService = app.register.mock.calls[index][0];
      expect(registeredService).toBeFunction();
      expect(registeredService.toString()).toBe(commonServices[service].toString());
    });
  });
});
