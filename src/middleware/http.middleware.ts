import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * HTTP request logging middleware
 */
export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
    headers: req.headers,
    ip: req.ip,
  });

  // Add response listener
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    // Log response
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
    });

    // Log performance metrics if response time is high
    if (responseTime > 1000) { // Log slow requests (>1s)
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime.toFixed(2)}ms`,
      });
    }
  });

  next();
}
