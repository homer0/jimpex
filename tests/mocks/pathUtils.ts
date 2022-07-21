import { PathUtils } from '@homer0/path-utils';

type JoinFromMock = jest.Mock<string, [string, string]>;

export type PathUtilsMockOptions = {
  joinFrom?: JoinFromMock;
};

export type PathUtilsMockMocks = {
  joinFrom: JoinFromMock;
};

export type PathUtilsMockResult = {
  pathUtils: PathUtils;
  pathUtilsMocks: PathUtilsMockMocks;
};

export const getPathUtilsMock = (
  options: PathUtilsMockOptions = {},
): PathUtilsMockResult => {
  const { joinFrom = jest.fn() } = options;
  const mocks = {
    joinFrom,
  };
  class MockedPathUtils extends PathUtils {
    override joinFrom(from: string, filepath: string): string {
      mocks.joinFrom(from, filepath);
      return filepath;
    }
  }
  return {
    pathUtils: new MockedPathUtils(),
    pathUtilsMocks: mocks,
  };
};
