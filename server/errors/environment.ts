/**
 * Environment-specific error classes
 * Extends the base ServerError class to provide specific error handling for different environments
 */

import { ServerError } from './base';

export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', 500, details);
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ServerError {
  constructor(message: string, port: number, details?: Record<string, unknown>) {
    super(
      message,
      'PORT_CONFIG_ERROR',
      500,
      { port, ...(details || {}) }
    );
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONFIG_ERROR', 500, details);
    this.name = 'DatabaseConfigError';
  }
}