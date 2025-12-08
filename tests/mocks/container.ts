import { Jimpex } from '@src/app/index.js';

export type JimpexMockOptions = {
  resources?: Record<string, unknown>;
  save?: boolean;
};

export type JimpexMockMocks = {
  get: jest.Mock<unknown, [string]>;
  set: jest.Mock<unknown, [string, unknown]>;
  try: jest.Mock<unknown, [string]>;
  on: jest.Mock<unknown, [string, (...args: unknown[]) => void]>;
  once: jest.Mock<unknown, [string, (...args: unknown[]) => void]>;
};

export type JimpexMockResult = {
  container: Jimpex;
  containerMocks: JimpexMockMocks;
  resources: Record<string, unknown>;
};

export const getJimpexMock = (options: JimpexMockOptions = {}): JimpexMockResult => {
  const { resources = {}, save = false } = options;
  const mocks = {
    get: jest.fn(),
    set: jest.fn(),
    try: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    isHealthy: jest.fn(),
    getConfig: jest.fn(),
  };
  class Container {
    set(...args: Parameters<Jimpex['set']>): ReturnType<Jimpex['set']> {
      mocks.set(...args);
      if (save) {
        const [name, getter] = args;
        const getterFn = getter as () => unknown;
        resources[name] = getterFn();
      }
    }

    get<T = unknown>(name: string): T {
      const result = mocks.get(name);
      if (resources[name]) return resources[name] as T;
      return result;
    }

    getConfig<T = unknown>(key?: string): T {
      const configService = this.get<
        | {
            get: (setting: string) => T;
          }
        | undefined
      >('config');
      if (configService) {
        if (key) return configService.get(key);
        return configService as unknown as T;
      }

      const result = mocks.getConfig();
      return result;
    }

    getRouter<T = unknown>(): T {
      return this.get<T>('router');
    }

    try<T = unknown>(name: string): T | undefined {
      const result = mocks.try(name);
      if (resources[name]) return resources[name] as T;
      return result;
    }

    on(...args: Parameters<Jimpex['on']>): ReturnType<Jimpex['on']> {
      return mocks.on(...args);
    }

    once(...args: Parameters<Jimpex['once']>): ReturnType<Jimpex['once']> {
      return mocks.once(...args);
    }

    isHealthy(): ReturnType<Jimpex['isHealthy']> {
      return mocks.isHealthy();
    }
  }

  return {
    container: new Container() as Jimpex,
    containerMocks: mocks,
    resources,
  };
};
