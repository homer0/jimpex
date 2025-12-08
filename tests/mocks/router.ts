import type { Router, RouterMethod } from '@src/types/index.js';

type RouteParams = Parameters<Router['get']>;

export type RouterMockMocks = Record<
  RouterMethod,
  jest.Mock<RouterMockMocks, RouteParams>
>;

export type RouterMockResult = {
  router: Router;
  routerMocks: RouterMockMocks;
};

export const getRouterMock = (): RouterMockResult => {
  const methods: RouterMethod[] = [
    'all',
    'get',
    'head',
    'post',
    'patch',
    'put',
    'delete',
    'connect',
    'options',
    'trace',
  ];
  const router = methods.reduce((acc, method) => {
    acc[method] = jest.fn<RouterMockMocks, RouteParams>(() => router);
    return acc;
  }, {} as RouterMockMocks);

  return {
    router: router as unknown as Router,
    routerMocks: router,
  };
};
