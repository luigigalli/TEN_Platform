/**
 * Environment-specific error classes
 * Extends the base ServerError class to provide specific error handling for different environments
 */

import { ConfigError } from './types';

export class EnvironmentConfigError extends ConfigError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', details);
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ConfigError {
  constructor(message: string, port: number, details?: Record<string, unknown>) {
    super(
      message,
      'PORT_CONFIG_ERROR',
      { port, ...(details || {}) }
    );
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ConfigError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONFIG_ERROR', details);
    this.name = 'DatabaseConfigError';
  }
}