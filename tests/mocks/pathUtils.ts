import { PathUtils } from '@homer0/path-utils';

type JoinFromMock = jest.Mock<string, [string, string]>;

export type GetPathUtilsMockOptions = {
  joinFrom?: JoinFromMock;
};

export type GetPathUtilsMockMocks = {
  joinFrom: JoinFromMock;
};

export type GetPathUtilsMockResult = {
  pathUtils: PathUtils;
  pathUtilsMocks: GetPathUtilsMockMocks;
};

export const getPathUtilsMock = (
  options: GetPathUtilsMockOptions = {},
): GetPathUtilsMockResult => {
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
