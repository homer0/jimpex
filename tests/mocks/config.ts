import { SimpleConfig } from '@homer0/simple-config';

export type ConfigMockMocks = {
  get: jest.Mock<unknown, Parameters<SimpleConfig['get']>>;
  getConfig: jest.Mock<unknown>;
  canSwitchConfigs: jest.Mock<boolean>;
  switch: jest.Mock<unknown, Parameters<SimpleConfig['switch']>>;
};

export type ConfigMockResult = {
  config: SimpleConfig;
  configMocks: ConfigMockMocks;
};

export const getConfigMock = (): ConfigMockResult => {
  const mocks = {
    get: jest.fn(),
    getConfig: jest.fn(),
    canSwitchConfigs: jest.fn(),
    switch: jest.fn(),
  };
  class MockedConfig extends SimpleConfig {
    override get<T = unknown>(...args: Parameters<SimpleConfig['get']>): T {
      return mocks.get(...args) as T;
    }
    override getConfig<T = unknown>(): T {
      return mocks.getConfig() as T;
    }
    override canSwitchConfigs(): boolean {
      return mocks.canSwitchConfigs();
    }
    override switch<T = unknown>(
      ...args: Parameters<SimpleConfig['switch']>
    ): Promise<T> {
      return mocks.switch(...args);
    }
  }

  return {
    config: new MockedConfig(),
    configMocks: mocks,
  };
};
