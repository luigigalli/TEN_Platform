import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';

export interface RequestLoggerOptions {
  excludePaths?: string[];
  logBody?: boolean;
  logQuery?: boolean;
  logHeaders?: boolean;
  sensitiveHeaders?: string[];
}

export function createRequestLogger(logger: Logger, options: RequestLoggerOptions = {}) {
  const {
    excludePaths = [],
    logBody = false,
    logQuery = false,
    logHeaders = false,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

    // Prepare request data
    const logData: any = {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    };

    // Add query parameters if enabled
    if (logQuery && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }

    // Add headers if enabled
    if (logHeaders) {
      const filteredHeaders = { ...req.headers };
      sensitiveHeaders.forEach(header => {
        if (filteredHeaders[header]) {
          filteredHeaders[header] = '[REDACTED]';
        }
      });
      logData.headers = filteredHeaders;
    }

    // Add body if enabled and present
    if (logBody && req.body && Object.keys(req.body).length > 0) {
      logData.body = req.body;
    }

    // Log request
    logger.info('Incoming request', logData);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const responseData = {
        requestId,
        statusCode: res.statusCode,
        duration
      };

      if (res.statusCode >= 400) {
        logger.warn('Request error', responseData);
      } else {
        logger.info('Request completed', responseData);
      }
    });

    next();
  };
}
