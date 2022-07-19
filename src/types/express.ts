import type { RequestHandler, ErrorRequestHandler } from 'express';

export type { Express, Router, Request, Response, NextFunction } from 'express';

export type ExpressMiddleware = RequestHandler | ErrorRequestHandler;
