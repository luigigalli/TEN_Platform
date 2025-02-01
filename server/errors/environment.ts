import { StatusCodes } from 'http-status-codes';
import { ServerError } from './base-error';

// Add localization support through message keys
export const ErrorMessageKeys = {
  ENV_VALIDATION: 'error.environment.validation',
  ENV_CONFIG: 'error.environment.config',
  DB_CONFIG: 'error.database.config',
  PORT_BINDING: 'error.port.binding'
} as const;

export class EnvironmentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, {
      ...details,
      userMessage: 'Unable to validate environment settings. Please check your configuration.',
      messageKey: ErrorMessageKeys.ENV_VALIDATION,
      troubleshooting: [
        'Verify environment variables are set correctly',
        'Check configuration files for any syntax errors',
        'Ensure all required services are running'
      ],
      documentation: '/docs/environment-configurations.md#troubleshooting-guide',
      environment: process.env.NODE_ENV
    });
  }
}

export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, {
      ...details,
      userMessage: 'Environment configuration error. Please check your settings.',
      messageKey: ErrorMessageKeys.ENV_CONFIG,
      troubleshooting: [
        'Review environment configuration files',
        'Check for missing or invalid settings',
        'Verify file permissions'
      ],
      documentation: '/docs/environment-configurations.md#configuration-guide',
      environment: process.env.NODE_ENV
    });
  }
}

export class DatabaseConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, {
      ...details,
      userMessage: 'Database configuration error. Please check your database settings.',
      messageKey: ErrorMessageKeys.DB_CONFIG,
      troubleshooting: [
        'Verify database connection string',
        'Check database credentials',
        'Ensure database service is running'
      ],
      documentation: '/docs/environment-configurations.md#database-configuration',
      environment: process.env.NODE_ENV
    });
  }
}

export class PortBindingError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, {
      ...details,
      userMessage: 'Port binding error. Please check port configuration.',
      messageKey: ErrorMessageKeys.PORT_BINDING,
      troubleshooting: [
        'Check if port is already in use',
        'Verify port number is valid',
        'Ensure you have permission to bind to port'
      ],
      documentation: '/docs/environment-configurations.md#port-configuration',
      environment: process.env.NODE_ENV
    });
  }
}