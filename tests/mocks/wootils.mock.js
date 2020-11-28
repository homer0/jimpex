const mocks = {
  appConfiguration: jest.fn(() => ({
    register: (app) => app.set('appConfiguration', 'appConfiguration'),
  })),
  appLogger: jest.fn((app) => app.set('appLogger', 'appLogger')),
  environmentUtils: jest.fn((app) => app.set('environmentUtils', 'environmentUtils')),
  packageInfo: jest.fn((app) => app.set('packageInfo', 'packageInfo')),
  pathUtils: jest.fn((app) => app.set('pathUtils', 'pathUtils')),
  rootRequire: jest.fn((app) => app.set('rootRequire', 'rootRequire')),
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
  appLogger: {
    register: mocks.appLogger,
  },
  environmentUtils: {
    register: mocks.environmentUtils,
  },
  packageInfo: {
    register: mocks.packageInfo,
  },
  pathUtils: {
    register: mocks.pathUtils,
  },
  rootRequire: {
    register: mocks.rootRequire,
  },
  deferred: mocks.deferred,
  mocks,
  reset: () => {
    Object.keys(mocks).forEach((name) => {
      mocks[name].mockClear();
    });
  },
};

module.exports = wootilsMock;
