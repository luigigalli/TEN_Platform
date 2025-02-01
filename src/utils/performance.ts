import { logger } from './logger';

interface PerformanceMetrics {
  operation: string;
  startTime: [number, number];
  metadata?: Record<string, any>;
}

const activeOperations = new Map<string, PerformanceMetrics>();

/**
 * Performance monitoring utility
 */
export const performance = {
  /**
   * Start tracking an operation
   */
  start(operation: string, metadata?: Record<string, any>) {
    const id = `${operation}_${Date.now()}`;
    activeOperations.set(id, {
      operation,
      startTime: process.hrtime(),
      metadata,
    });
    return id;
  },

  /**
   * End tracking an operation and log its performance
   */
  end(id: string) {
    const metrics = activeOperations.get(id);
    if (!metrics) {
      logger.warn('No matching operation found', { id });
      return;
    }

    const [seconds, nanoseconds] = process.hrtime(metrics.startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

    activeOperations.delete(id);

    // Log performance metrics
    logger.info('Operation completed', {
      operation: metrics.operation,
      duration: `${duration.toFixed(2)}ms`,
      ...metrics.metadata,
    });

    // Log warning for slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        operation: metrics.operation,
        duration: `${duration.toFixed(2)}ms`,
        ...metrics.metadata,
      });
    }

    return duration;
  },

  /**
   * Wrap an async function with performance tracking
   */
  async track<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const id = this.start(operation, metadata);
    try {
      const result = await fn();
      this.end(id);
      return result;
    } catch (error) {
      this.end(id);
      throw error;
    }
  },
};
