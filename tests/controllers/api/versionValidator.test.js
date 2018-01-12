const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/controllers/api/versionValidator');

require('jasmine-expect');
const {
  VersionValidatorController,
  versionValidatorController,
} = require('/src/controllers/api/versionValidator');

describe('controllers/api:versionValidator', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const versionValidator = 'versionValidator';
    let sut = null;
    // When
    sut = new VersionValidatorController(versionValidator);
    // Then
    expect(sut).toBeInstanceOf(VersionValidatorController);
    expect(sut.versionValidator).toBe(versionValidator);
  });

  it('should return the versionValidator middleware when `validate` is called', () => {
    // Given
    const versionValidator = 'versionValidator';
    let sut = null;
    let result = null;
    // When
    sut = new VersionValidatorController(versionValidator);
    result = sut.validate();
    // Then
    expect(result).toBe(versionValidator);
  });

  it('should include a controller shorthand to return its routes', () => {
    // Given
    const services = {
      router: {
        all: jest.fn((route, middleware) => [`all:${route}`, middleware]),
      },
    };
    const app = {
      get: jest.fn((service) => (services[service] || service)),
    };
    let routes = null;
    const expectedGets = ['router', 'versionValidator'];
    // When
    routes = versionValidatorController.connect(app);
    // Then
    expect(routes).toEqual([
      ['all:/:version/*', 'versionValidator'],
    ]);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
  });
});
