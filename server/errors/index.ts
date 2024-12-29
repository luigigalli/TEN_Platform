/**
 * Centralized error handling system
 * Single source of truth for all application errors
 */

// Base error class with proper typing
export class ServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

// Base configuration error
export class ConfigError extends ServerError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 500, details);
    this.name = 'ConfigError';
  }
}

// Specific error types
export class EnvironmentConfigError extends ConfigError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', details);
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ConfigError {
  constructor(message: string, port: number, details?: Record<string, unknown>) {
    super(message, 'PORT_CONFIG_ERROR', { port, ...(details || {}) });
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ConfigError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONFIG_ERROR', details);
    this.name = 'DatabaseConfigError';
  }
}