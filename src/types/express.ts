import type { RequestHandler, ErrorRequestHandler } from 'express';

export type { Express, Router, Request, Response, NextFunction } from 'express';

export type ExpressMiddlewareLike = RequestHandler | ErrorRequestHandler;
export type ExpressMiddleware = RequestHandler;
export type AsyncExpressMiddleware = (
  ...args: Parameters<ExpressMiddleware>
) => Promise<void>;
export type ExpressErrorHandler = ErrorRequestHandler;
export type RouterMethod =
  | 'all'
  | 'get'
  | 'head'
  | 'post'
  | 'patch'
  | 'put'
  | 'delete'
  | 'connect'
  | 'options'
  | 'trace';
