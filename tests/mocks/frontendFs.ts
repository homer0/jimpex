import { pathUtils } from '@homer0/path-utils';
import { FrontendFs } from '@src/services/frontend/frontendFs.js';

export type FrontendFsMockOptions = {
  values?: Record<string, string>;
};

export type FrontendFsMockMocks = {
  read: jest.Mock<Promise<string>, Parameters<FrontendFs['read']>>;
  write: jest.Mock<Promise<void>, Parameters<FrontendFs['write']>>;
  delete: jest.Mock<Promise<void>, Parameters<FrontendFs['delete']>>;
};

export type FrontendFsMockResult = {
  frontendFs: FrontendFs;
  frontendFsMocks: FrontendFsMockMocks;
};

export const getFrontendFsMock = (
  options: FrontendFsMockOptions = {},
): FrontendFsMockResult => {
  const { values = {} } = options;

  const mocks = {
    read: jest.fn(),
    write: jest.fn(),
    delete: jest.fn(),
  };
  class MockedFrontendFs extends FrontendFs {
    override read(
      ...args: Parameters<FrontendFs['read']>
    ): ReturnType<FrontendFs['read']> {
      mocks.read(...args);
      return Promise.resolve(values[args[0]]!);
    }
    override write(
      ...args: Parameters<FrontendFs['write']>
    ): ReturnType<FrontendFs['write']> {
      mocks.write(...args);
      return Promise.resolve();
    }
    override delete(
      ...args: Parameters<FrontendFs['delete']>
    ): ReturnType<FrontendFs['delete']> {
      mocks.delete(...args);
      return Promise.resolve();
    }
  }

  return {
    frontendFs: new MockedFrontendFs({ inject: { pathUtils: pathUtils() } }),
    frontendFsMocks: mocks,
  };
};
