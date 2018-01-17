const mocks = {
  set: jest.fn(),
  disable: jest.fn(),
  use: jest.fn(),
  static: jest.fn((staticsPath) => staticsPath),
  router: jest.fn(() => 'router'),
  closeInstance: jest.fn(),
  listen: jest.fn((port, fn) => {
    fn();
    return {
      close: mocks.closeInstance,
    };
  }),
};

const expressMock = jest.fn(() => mocks);
expressMock.mocks = mocks;
expressMock.static = mocks.static;
expressMock.Router = mocks.router;
expressMock.reset = () => {
  expressMock.mockClear();
  Object.keys(mocks).forEach((name) => {
    mocks[name].mockClear();
  });
};

module.exports = expressMock;
