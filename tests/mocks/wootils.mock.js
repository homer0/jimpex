const mocks = {
  appConfiguration: jest.fn(() => 'appConfiguration'),
};

const wootilsMock = {
  appConfiguration: mocks.appConfiguration,
  appLogger: 'appLogger',
  environmentUtils: 'environmentUtils',
  packageInfo: 'packageInfo',
  pathUtils: 'pathUtils',
  rootRequire: 'rootRequire',
  reset: () => {
    Object.keys(mocks).forEach((name) => {
      mocks[name].mockClear();
    });
  },
};

module.exports = wootilsMock;
