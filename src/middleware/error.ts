import { Request, Response, NextFunction, Express, ErrorRequestHandler } from 'express';
import { BaseError } from '../errors/types';
import { handleKnownError, handleUnknownError, handle404 } from '../errors/handlers';
import { logger } from '../utils/logger';

interface ErrorHandlingOptions {
  logErrors?: boolean;
}

/**
 * Create error logging middleware
 */
function createErrorLoggingMiddleware({ logErrors = true }: ErrorHandlingOptions): ErrorRequestHandler {
  return (err: Error, req: Request, _res: Response, next: NextFunction) => {
    if (!logErrors) {
      next(err);
      return;
    }

    const isBaseError = err instanceof BaseError;
    const context = {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      params: req.params,
      headers: req.headers,
      ip: req.ip
    };

    if (isBaseError) {
      const baseError = err as BaseError;
      logger.error(baseError.message, err, {
        ...context,
        statusCode: baseError.statusCode,
        errorCode: baseError.code,
        errorContext: baseError.context
      });
    } else {
      logger.error('Unexpected error occurred', err, context);
    }

    next(err);
  };
}

/**
 * Create error handling middleware chain
 */
export function createErrorHandlingMiddleware(options: ErrorHandlingOptions = {}) {
  return [
    // Log all errors
    createErrorLoggingMiddleware(options),

    // Handle 404 errors
    (req: Request, res: Response, next: NextFunction) => {
      if (!res.headersSent) {
        handle404(req, res, next);
      }
    },

    // Handle known errors (BaseError instances)
    ((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof BaseError) {
        if (!res.headersSent) {
          handleKnownError(err, req, res, next);
        } else {
          next(err);
        }
      } else {
        next(err);
      }
    }) as ErrorRequestHandler,

    // Handle unknown errors
    ((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (!res.headersSent) {
        handleUnknownError(err, req, res, next);
      }
    }) as ErrorRequestHandler
  ];
}

/**
 * Setup error handling for Express app
 */
export function setupErrorHandling(app: Express) {
  logger.info('Setting up error handling middleware');

  // Add error handling middleware
  const middleware = createErrorHandlingMiddleware({ logErrors: true });
  middleware.forEach(handler => app.use(handler));

  logger.info('Error handling middleware setup complete');
}

/**
 * Handle 404 errors
 */
export function notFoundMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!res.headersSent) {
    logger.warn('Route not found', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    handle404(req, res, next);
  }
}
