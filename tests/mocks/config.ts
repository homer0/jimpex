import { SimpleConfig } from '@homer0/simple-config';

export type ConfigMockMocks = {
  get: jest.Mock<unknown, Parameters<SimpleConfig['get']>>;
};

export type ConfigMockResult = {
  config: SimpleConfig;
  configMocks: ConfigMockMocks;
};

export const getConfigMock = (): ConfigMockResult => {
  const mocks = {
    get: jest.fn(),
  };
  class MockedConfig extends SimpleConfig {
    override get<T = unknown>(...args: Parameters<SimpleConfig['get']>): T {
      return mocks.get(...args) as T;
    }
  }

  return {
    config: new MockedConfig(),
    configMocks: mocks,
  };
};
