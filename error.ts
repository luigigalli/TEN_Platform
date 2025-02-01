import { Request, Response, NextFunction, Application } from 'express';
import { ServerError } from '../errors';
import { logger } from '../utils/logger';

export interface ErrorHandlingOptions {
  logErrors?: boolean;
  includeStackTrace?: boolean;
}

/**
 * Wraps an async route handler to properly handle rejected promises
 */
export function wrapAsync(fn: Function) {
  return function(req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

/**
 * Sets up error handling middleware for the application
 */
export function setupErrorHandling(app: Application, options: ErrorHandlingOptions = {}) {
  const { logErrors = true, includeStackTrace = false } = options;

  // Log all errors if enabled
  if (logErrors) {
    app.use((err: Error, req: Request, _res: Response, next: NextFunction) => {
      logger.error('Request error', {
        error: err.message,
        stack: includeStackTrace ? err.stack : undefined,
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        user: (req as any).user
      });
      next(err);
    });
  }

  // Handle known error types
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ServerError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
        ...(err.details && { details: err.details })
      });
    }

    next(err);
  });

  // Handle unknown errors
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: 'Internal Server Error',
      message: includeStackTrace ? err.message : 'An unexpected error occurred',
      ...(includeStackTrace && { stack: err.stack })
    });
  });
}
