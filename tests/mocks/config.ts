import { vi, type Mock } from 'vitest';
import type { SimpleConfig } from '@homer0/simple-config';

export type ConfigMockMocks = {
  get: Mock<(...args: Parameters<SimpleConfig['get']>) => unknown>;
  set: Mock<(...args: Parameters<SimpleConfig['set']>) => unknown>;
  getConfig: Mock<() => unknown>;
  canSwitchConfigs: Mock<() => boolean>;
  switch: Mock<(...args: Parameters<SimpleConfig['switch']>) => unknown>;
  loadFromFile: Mock<(...args: Parameters<SimpleConfig['loadFromFile']>) => unknown>;
  loadFromEnv: Mock<(...args: Parameters<SimpleConfig['loadFromEnv']>) => unknown>;
};

export type ConfigMockResult = {
  config: SimpleConfig;
  configMocks: ConfigMockMocks;
};

export const getConfigMock = (): ConfigMockResult => {
  const mocks = {
    set: vi.fn(),
    get: vi.fn(),
    getConfig: vi.fn(),
    canSwitchConfigs: vi.fn(),
    switch: vi.fn(),
    loadFromFile: vi.fn(),
    loadFromEnv: vi.fn(),
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
