// This file contains environment-specific error definitions with enhanced user feedback
import { ServerError } from './base-error';

export class EnvironmentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      'ENV_VALIDATION_ERROR',
      400,
      {
        ...details,
        userMessage: 'Unable to validate environment settings. Please check your configuration.',
        troubleshooting: [
          'Verify environment variables are set correctly',
          'Check configuration files for any syntax errors',
          'Ensure all required services are running'
        ]
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
        troubleshooting: [
          'Check environment-specific settings',
          'Verify configuration file syntax',
          'Ensure all required variables are defined'
        ]
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
        troubleshooting: [
          'Verify deployment configuration',
          'Check service availability',
          'Ensure proper environment detection'
        ]
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
        troubleshooting: [
          'Check database credentials',
          'Verify network connectivity',
          'Ensure database service is running'
        ]
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
        troubleshooting: [
          'Check if port is already in use',
          'Verify port configuration',
          'Ensure proper permissions'
        ]
      }
    );
    this.name = 'PortBindingError';
  }
}