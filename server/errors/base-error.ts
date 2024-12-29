// Base error class for the application
export class ServerError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'SERVER_ERROR',
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

// Environment-specific errors
export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', 500, details);
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ServerError {
  constructor(message: string, port: number) {
    super(message, 'PORT_CONFIG_ERROR', 500, { port });
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONFIG_ERROR', 500, details);
    this.name = 'DatabaseConfigError';
  }
}

// Vite-specific errors
export class ViteServerError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VITE_SERVER_ERROR', 500, details);
    this.name = 'ViteServerError';
  }
}