const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
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
    httpServices.all(app);
    // When/Then
    expect(app.register).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service, index) => {
      const registeredService = app.register.mock.calls[index][0];
      expect(registeredService).toBeFunction();
      expect(registeredService.toString()).toBe(httpServices[service].toString());
    });
  });
});
