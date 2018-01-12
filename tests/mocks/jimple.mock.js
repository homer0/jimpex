const services = {};

const mocks = {
  set: jest.fn(),
  get: jest.fn((name) => services[name]),
  register: jest.fn(),
  factory: jest.fn((fn) => fn()),
};

class JimpleMock {
  static mock(name, mock) {
    mocks[name] = mock;
  }

  static service(name, mock) {
    services[name] = mock;
  }

  static reset() {
    Object.keys(mocks).forEach((name) => {
      mocks[name].mockClear();
    });

    Object.keys(services).forEach((name) => {
      delete services[name];
    });
  }

  static provider(register) {
    return register;
  }

  constructor() {
    this.set = mocks.set;
    this.get = mocks.get;
    this.register = mocks.register;
    this.factory = mocks.factory;
  }
}

module.exports = JimpleMock;
