import type { RequestHandler, ErrorRequestHandler } from 'express';

export type { Express, Router } from 'express';

export type ExpressMiddleware = RequestHandler | ErrorRequestHandler;
