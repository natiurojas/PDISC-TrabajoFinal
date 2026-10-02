import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'not_found', message: `Ruta no encontrada: ${req.method} ${req.path}` },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  const error = err instanceof Error ? err : new Error(String(err));
  console.error('[pelipop] error no controlado:', error);

  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Error interno del servidor',
      ...(config.isProduction ? {} : { details: error.message }),
    },
  });
}