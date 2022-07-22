import type { RequestHandler, ErrorRequestHandler } from 'express';

export type { Express, Router, Request, Response, NextFunction } from 'express';

export type ExpressMiddlewareLike = RequestHandler | ErrorRequestHandler;
export type ExpressMiddleware = RequestHandler;
