/**
 * Base error types for the server
 * All custom errors should extend from these base types
 */

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

export class ConfigError extends ServerError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 500, details);
    this.name = 'ConfigError';
  }
}
