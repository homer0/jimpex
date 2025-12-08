import { vi, type Mock } from 'vitest';
import type { PathUtils } from '@homer0/path-utils';

type JoinFromMock = Mock<(a: string, b: string) => string>;

export type PathUtilsMockOptions = {
  joinFrom?: JoinFromMock;
};

export type PathUtilsMockMocks = {
  joinFrom: JoinFromMock;
  addLocation: Mock<(...args: string[]) => string>;
};

export type PathUtilsMockResult = {
  pathUtils: PathUtils;
  pathUtilsMocks: PathUtilsMockMocks;
};

export const getPathUtilsMock = (
  options: PathUtilsMockOptions = {},
): PathUtilsMockResult => {
  const { joinFrom = vi.fn() } = options;
  const mocks = {
    joinFrom,
    addLocation: vi.fn(),
  };
  class MockedPathUtils {
    joinFrom(from: string, filepath: string): string {
      mocks.joinFrom(from, filepath);
      return filepath;
    }

    addLocation(...args: Parameters<PathUtils['addLocation']>): void {
      return mocks.addLocation(...args);
    }
  }
  return {
    pathUtils: new MockedPathUtils() as PathUtils,
    pathUtilsMocks: mocks,
  };
};
