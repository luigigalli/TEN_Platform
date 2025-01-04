// This file contains environment-specific error definitions with enhanced user feedback
import { ServerError } from './base-error';
import { z } from 'zod';

// Add localization support through message keys
export const ErrorMessageKeys = {
  ENV_VALIDATION: 'error.environment.validation',
  ENV_CONFIG: 'error.environment.config',
  DEPLOYMENT_VALIDATION: 'error.deployment.validation',
  DB_CONNECTION: 'error.database.connection',
  PORT_BINDING: 'error.port.binding'
} as const;

export class EnvironmentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'ENV_VALIDATION_ERROR',
      400,
      {
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
      }
    );
    this.name = 'EnvironmentValidationError';
  }
}

export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'ENV_CONFIG_ERROR',
      500,
      {
        ...details,
        userMessage: 'Environment configuration error detected. Our team has been notified.',
        messageKey: ErrorMessageKeys.ENV_CONFIG,
        troubleshooting: [
          'Check environment-specific settings',
          'Verify configuration file syntax',
          'Ensure all required variables are defined',
          'Review environment logs for detailed errors'
        ],
        documentation: '/docs/environment-configurations.md#configuration-components',
        environment: process.env.NODE_ENV
      }
    );
    this.name = 'EnvironmentConfigError';
  }
}

export class DeploymentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'DEPLOYMENT_VALIDATION_ERROR',
      500,
      {
        ...details,
        userMessage: 'Unable to validate deployment settings. Please try again later.',
        messageKey: ErrorMessageKeys.DEPLOYMENT_VALIDATION,
        troubleshooting: [
          'Verify deployment configuration',
          'Check service availability',
          'Ensure proper environment detection',
          'Review deployment logs for specific errors'
        ],
        documentation: '/docs/environment-configurations.md#deployment-configuration',
        environment: process.env.NODE_ENV
      }
    );
    this.name = 'DeploymentValidationError';
  }
}

export class DatabaseConnectionError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'DB_CONNECTION_ERROR',
      500,
      {
        ...details,
        userMessage: 'Unable to connect to the database. Please try again later.',
        messageKey: ErrorMessageKeys.DB_CONNECTION,
        troubleshooting: [
          'Check database credentials',
          'Verify network connectivity',
          'Ensure database service is running',
          'Review database logs for connection errors',
          'Verify SSL configuration if enabled'
        ],
        documentation: '/docs/environment-configurations.md#database-configuration',
        environment: process.env.NODE_ENV
      }
    );
    this.name = 'DatabaseConnectionError';
  }
}

export class PortBindingError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'PORT_BINDING_ERROR',
      500,
      {
        ...details,
        userMessage: 'Unable to start the service. Please try again later.',
        messageKey: ErrorMessageKeys.PORT_BINDING,
        troubleshooting: [
          'Check if port is already in use',
          'Verify port configuration',
          'Ensure proper permissions',
          'Review system logs for port conflicts'
        ],
        documentation: '/docs/environment-configurations.md#server-configuration',
        environment: process.env.NODE_ENV
      }
    );
    this.name = 'PortBindingError';
  }
}

// Validation schema for error messages
export const errorMessageSchema = z.object({
  message: z.string(),
  code: z.string(),
  statusCode: z.number(),
  details: z.object({
    userMessage: z.string(),
    messageKey: z.string(),
    troubleshooting: z.array(z.string()),
    documentation: z.string(),
    environment: z.string().optional()
  }).optional()
});

export type ErrorMessage = z.infer<typeof errorMessageSchema>;