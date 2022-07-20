import { Jimpex } from '@src/app';

export type GetJimpexMockOptions = {
  resources?: Record<string, unknown>;
};

export type GetJimpexMockMocks = {
  get: jest.Mock<unknown, [string]>;
  set: jest.Mock<unknown, [string, unknown]>;
};

export type GetJimpexMockResult = {
  container: Jimpex;
  containerMocks: GetJimpexMockMocks;
};

export const getJimpexMock = (
  options: GetJimpexMockOptions = {},
): GetJimpexMockResult => {
  const { resources = {} } = options;
  const mocks = {
    get: jest.fn(),
    set: jest.fn(),
    try: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };
  class Container extends Jimpex {
    override set(...args: Parameters<Jimpex['set']>): ReturnType<Jimpex['set']> {
      mocks.set(...args);
      return super.set(...args);
    }
    override get<T = unknown>(name: string): T {
      mocks.get(name);
      if (resources[name]) return resources[name] as T;
      return super.get(name);
    }
    override try<T = unknown>(name: string): T | undefined {
      mocks.try(name);
      if (resources[name]) return resources[name] as T;
      return super.try<T>(name);
    }
    override on(...args: Parameters<Jimpex['on']>): ReturnType<Jimpex['on']> {
      mocks.on(...args);
      return super.on(...args);
    }
    override once(...args: Parameters<Jimpex['once']>): ReturnType<Jimpex['once']> {
      mocks.once(...args);
      return super.once(...args);
    }
  }

  return {
    container: new Container(),
    containerMocks: mocks,
  };
};
