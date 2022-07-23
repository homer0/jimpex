import { Jimpex } from '@src/app';

export type JimpexMockOptions = {
  resources?: Record<string, unknown>;
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
};

export const getJimpexMock = (options: JimpexMockOptions = {}): JimpexMockResult => {
  const { resources = {} } = options;
  const mocks = {
    get: jest.fn(),
    set: jest.fn(),
    try: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };
  class Container {
    set(...args: Parameters<Jimpex['set']>): ReturnType<Jimpex['set']> {
      mocks.set(...args);
    }

    get<T = unknown>(name: string): T {
      const result = mocks.get(name);
      if (resources[name]) return resources[name] as T;
      return result;
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
  }

  return {
    container: new Container() as Jimpex,
    containerMocks: mocks,
  };
};
