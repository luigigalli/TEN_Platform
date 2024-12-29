/**
 * Centralized error handling for the server
 * All custom errors should extend from this base class
 */
export class ServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServerError';
  }
}

export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: unknown) {
    super(message, 'ENV_CONFIG_ERROR', 500, details);
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ServerError {
  constructor(message: string, port: number, details?: unknown) {
    super(
      message,
      'PORT_CONFIG_ERROR',
      500,
      { port, ...details }
    );
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ServerError {
  constructor(message: string, details?: unknown) {
    super(message, 'DB_CONFIG_ERROR', 500, details);
    this.name = 'DatabaseConfigError';
  }
}
