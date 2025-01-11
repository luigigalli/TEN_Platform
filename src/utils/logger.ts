import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: any;
  timestamp?: string;
}

export interface LoggerOptions {
  level?: LogLevel;
  logDirectory?: string;
  maxFiles?: string;
}

const LogLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

function formatLogEntry(entry: LogEntry): LogEntry {
  return {
    level: entry.level,
    message: entry.message,
    context: entry.context,
    error: entry.error,
    timestamp: new Date().toISOString()
  };
}

export function createLogger(options: LoggerOptions = {}) {
  const {
    level = 'info',
    logDirectory = 'logs',
    maxFiles = '14d'
  } = options;

  const dirname = path.resolve(process.cwd(), logDirectory);

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ];

  if (process.env.NODE_ENV !== 'test') {
    transports.push(
      new DailyRotateFile({
        dirname,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles,
        format: winston.format.json()
      })
    );
  }

  const logger = winston.createLogger({
    level,
    levels: LogLevels,
    format: winston.format.combine(
      process.env.NODE_ENV !== 'production' ? winston.format.errors({ stack: true }) : winston.format.errors(),
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports
  });

  return {
    error(message: string, error?: any, context?: Record<string, any>) {
      logger.error(formatLogEntry({
        level: 'error',
        message,
        error,
        context
      }));
    },

    warn(message: string, context?: Record<string, any>) {
      logger.warn(formatLogEntry({
        level: 'warn',
        message,
        context
      }));
    },

    info(message: string, context?: Record<string, any>) {
      logger.info(formatLogEntry({
        level: 'info',
        message,
        context
      }));
    },

    http(message: string, context?: Record<string, any>) {
      logger.http(formatLogEntry({
        level: 'http',
        message,
        context
      }));
    },

    debug(message: string, context?: Record<string, any>) {
      logger.debug(formatLogEntry({
        level: 'debug',
        message,
        context
      }));
    },

    trace(message: string, context?: Record<string, any>) {
      logger.log('trace', formatLogEntry({
        level: 'trace',
        message,
        context
      }));
    }
  };
}

// Create default logger instance
export const logger = createLogger();
