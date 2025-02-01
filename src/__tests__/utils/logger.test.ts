import winston from 'winston';
import { createLogger, LogLevel } from '../../utils/logger';
import path from 'path';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    errors: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis()
  };

  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  };

  return {
    format: mockFormat,
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
});

// Mock winston-daily-rotate-file
jest.mock('winston-daily-rotate-file');

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create logger with default options', () => {
      createLogger();
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
    });

    it('should create logger with custom options', () => {
      const options = {
        level: 'debug' as LogLevel,
        logDirectory: 'custom-logs',
        maxFiles: '7d'
      };
      createLogger(options);
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: options.level
        })
      );
    });

    it('should include error stack traces in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      createLogger();
      
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include error stack traces in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      createLogger();
      
      expect(winston.format.errors).toHaveBeenCalledWith();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include file transport in test environment', () => {
      createLogger();
      expect(require('winston-daily-rotate-file')).not.toHaveBeenCalled();
    });

    it('should include file transport in non-test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      createLogger({
        logDirectory: 'test-logs'
      });
      
      expect(require('winston-daily-rotate-file')).toHaveBeenCalledWith(
        expect.objectContaining({
          dirname: path.resolve(process.cwd(), 'test-logs'),
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD'
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logger methods', () => {
    let logger: ReturnType<typeof createLogger>;
    let mockWinstonLogger: any;

    beforeEach(() => {
      logger = createLogger();
      mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
    });

    it('should log error with context and error object', () => {
      const message = 'Test error';
      const error = new Error('Test error');
      const context = { userId: '123' };

      logger.error(message, error, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message,
          error,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log warning with context', () => {
      const message = 'Test warning';
      const context = { userId: '123' };

      logger.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log info with context', () => {
      const message = 'Test info';
      const context = { userId: '123' };

      logger.info(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log http with context', () => {
      const message = 'Test http';
      const context = { method: 'GET', path: '/test' };

      logger.http(message, context);

      expect(mockWinstonLogger.http).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'http',
          message,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log debug with context', () => {
      const message = 'Test debug';
      const context = { function: 'testFunction' };

      logger.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          message,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log trace with context', () => {
      const message = 'Test trace';
      const context = { detail: 'trace detail' };

      logger.trace(message, context);

      expect(mockWinstonLogger.log).toHaveBeenCalledWith(
        'trace',
        expect.objectContaining({
          level: 'trace',
          message,
          context,
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle undefined context', () => {
      const message = 'Test message';

      logger.info(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message,
          timestamp: expect.any(String)
        })
      );
    });
  });
});
