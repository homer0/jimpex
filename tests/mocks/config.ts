import { SimpleConfig } from '@homer0/simple-config';

export type GetConfigMockOptions = {
  values?: Record<string, unknown>;
};

export type GetConfigMockMocks = {
  get: jest.Mock<void, Parameters<SimpleConfig['get']>>;
};

export type GetConfigMockResult = {
  config: SimpleConfig;
  configMocks: GetConfigMockMocks;
};

export const GetConfigMock = (
  options: GetConfigMockOptions = {},
): GetConfigMockResult => {
  const { values = {} } = options;
  const mocks = {
    get: jest.fn(),
  };
  class MockedConfig extends SimpleConfig {
    override get<T = unknown>(...args: Parameters<SimpleConfig['get']>): T {
      mocks.get(...args);
      if (typeof args === 'string' && typeof values[args] !== 'undefined')
        return values[args] as T;
      return super.get<T>(...args);
    }
  }

  return {
    config: new MockedConfig(),
    configMocks: mocks,
  };
};
