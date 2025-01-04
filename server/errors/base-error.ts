// Base error class for the application
import { z } from 'zod';
import { errorMessageSchema, type ErrorMessage } from './environment';

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

  toJSON(): ErrorMessage {
    const errorObj = {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };

    // Validate error message format
    const result = errorMessageSchema.safeParse(errorObj);
    if (!result.success) {
      console.error('Invalid error message format:', result.error);
      // Fallback to basic error format
      return {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: {
          userMessage: 'An unexpected error occurred',
          messageKey: 'error.unexpected',
          troubleshooting: ['Please try again later'],
          documentation: '/docs/error-handling.md',
          environment: process.env.NODE_ENV
        }
      };
    }

    return result.data;
  }

  // Helper method to get localized message key
  getMessageKey(): string {
    return this.details?.messageKey as string || 'error.unexpected';
  }

  // Helper method to get documentation link
  getDocumentationLink(): string {
    return this.details?.documentation as string || '/docs/error-handling.md';
  }

  // Helper method to get troubleshooting steps
  getTroubleshootingSteps(): string[] {
    return (this.details?.troubleshooting as string[]) || ['Please try again later'];
  }
}

// Environment-specific errors
export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', 500, {
      ...details,
      messageKey: 'error.environment.config',
      documentation: '/docs/environment-configurations.md#configuration-components'
    });
    this.name = 'EnvironmentConfigError';
  }
}

export class PortConfigError extends ServerError {
  constructor(message: string, port: number) {
    super(message, 'PORT_CONFIG_ERROR', 500, {
      port,
      messageKey: 'error.port.config',
      documentation: '/docs/environment-configurations.md#server-configuration'
    });
    this.name = 'PortConfigError';
  }
}

export class DatabaseConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONFIG_ERROR', 500, {
      ...details,
      messageKey: 'error.database.config',
      documentation: '/docs/environment-configurations.md#database-configuration'
    });
    this.name = 'DatabaseConfigError';
  }
}

// Vite-specific errors
export class ViteServerError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VITE_SERVER_ERROR', 500, {
      ...details,
      messageKey: 'error.vite.server',
      documentation: '/docs/environment-configurations.md#frontend-configuration'
    });
    this.name = 'ViteServerError';
  }
}

// Authentication errors
export class AuthenticationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, {
      ...details,
      messageKey: 'error.authentication',
      documentation: '/docs/api.md#authentication'
    });
    this.name = 'AuthenticationError';
  }
}

// Validation errors
export class ValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, {
      ...details,
      messageKey: 'error.validation',
      documentation: '/docs/api.md#error-handling'
    });
    this.name = 'ValidationError';
  }
}

// Resource errors
export class ResourceNotFoundError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESOURCE_NOT_FOUND', 404, {
      ...details,
      messageKey: 'error.resource.notfound',
      documentation: '/docs/api.md#error-handling'
    });
    this.name = 'ResourceNotFoundError';
  }
}

export class ResourceConflictError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESOURCE_CONFLICT', 409, {
      ...details,
      messageKey: 'error.resource.conflict',
      documentation: '/docs/api.md#error-handling'
    });
    this.name = 'ResourceConflictError';
  }
}