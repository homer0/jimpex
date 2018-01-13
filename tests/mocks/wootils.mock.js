const mocks = {
  appConfiguration: jest.fn(() => 'appConfiguration'),
  deferredResolve: jest.fn(),
  deferredReject: jest.fn(),
  deferred: jest.fn(() => ({
    resolve: mocks.deferredResolve,
    reject: mocks.deferredReject,
    promise: 'promise',
  })),
};

const wootilsMock = {
  appConfiguration: mocks.appConfiguration,
  deferred: mocks.deferred,
  appLogger: 'appLogger',
  environmentUtils: 'environmentUtils',
  packageInfo: 'packageInfo',
  pathUtils: 'pathUtils',
  rootRequire: 'rootRequire',
  mocks,
  reset: () => {
    Object.keys(mocks).forEach((name) => {
      mocks[name].mockClear();
    });
  },
};

module.exports = wootilsMock;
