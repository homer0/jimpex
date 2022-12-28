import type { SimpleConfig } from '@homer0/simple-config';

export type ConfigMockMocks = {
  get: jest.Mock<unknown, Parameters<SimpleConfig['get']>>;
  set: jest.Mock<unknown, Parameters<SimpleConfig['set']>>;
  getConfig: jest.Mock<unknown>;
  canSwitchConfigs: jest.Mock<boolean>;
  switch: jest.Mock<unknown, Parameters<SimpleConfig['switch']>>;
  loadFromFile: jest.Mock<unknown, Parameters<SimpleConfig['loadFromFile']>>;
  loadFromEnv: jest.Mock<unknown, Parameters<SimpleConfig['loadFromEnv']>>;
};

export type ConfigMockResult = {
  config: SimpleConfig;
  configMocks: ConfigMockMocks;
};

export const getConfigMock = (): ConfigMockResult => {
  const mocks = {
    set: jest.fn(),
    get: jest.fn(),
    getConfig: jest.fn(),
    canSwitchConfigs: jest.fn(),
    switch: jest.fn(),
    loadFromFile: jest.fn(),
    loadFromEnv: jest.fn(),
  };
  class MockedConfig {
    get<T = unknown>(...args: Parameters<SimpleConfig['get']>): T {
      return mocks.get(...args) as T;
    }
    set<T = unknown>(...args: Parameters<SimpleConfig['set']>): T {
      return mocks.set(...args) as T;
    }
    getConfig<T = unknown>(): T {
      return mocks.getConfig() as T;
    }
    canSwitchConfigs(): boolean {
      return mocks.canSwitchConfigs();
    }
    switch<T = unknown>(...args: Parameters<SimpleConfig['switch']>): Promise<T> {
      return mocks.switch(...args);
    }
    loadFromFile<T = unknown>(
      ...args: Parameters<SimpleConfig['loadFromFile']>
    ): Promise<T> {
      return mocks.loadFromFile(...args);
    }
    loadFromEnv<T = unknown>(
      ...args: Parameters<SimpleConfig['loadFromEnv']>
    ): Promise<T> {
      return mocks.loadFromEnv(...args);
    }
  }

  return {
    config: new MockedConfig() as SimpleConfig,
    configMocks: mocks,
  };
};
