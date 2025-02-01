import { Request, Response, NextFunction } from 'express';
import { BaseError } from './types';
import { logger } from '../utils/logger';

/**
 * Format error response
 */
export function formatError(error: Error, includeStack = false) {
  const isBaseError = error instanceof BaseError;
  const response: Record<string, any> = {
    status: 'error',
    code: isBaseError ? error.code : 'INTERNAL_SERVER_ERROR',
    message: isBaseError ? error.message : (
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    )
  };

  if (isBaseError && error.context && Object.keys(error.context).length > 0) {
    response.details = error.context;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Handle known errors (instances of BaseError)
 */
export function handleKnownError(
  error: BaseError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(error.statusCode).json(formatError(error));
}

/**
 * Handle unknown errors (not instances of BaseError)
 */
export function handleUnknownError(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Unexpected error', error);
  res.status(500).json(formatError(error));
}

/**
 * Handle 404 Not Found errors
 */
export function handle404(req: Request, res: Response, _next: NextFunction) {
  const error = {
    status: 'error',
    code: 'ROUTE_NOT_FOUND',
    message: 'Route not found',
    details: {
      method: req.method,
      url: req.originalUrl
    }
  };

  res.status(404).json(error);
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
