// This file contains environment-specific error definitions
import { ServerError } from './base-error';

export class EnvironmentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_VALIDATION_ERROR', 400, details);
    this.name = 'EnvironmentValidationError';
  }
}

export class EnvironmentConfigError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ENV_CONFIG_ERROR', 500, details);
    this.name = 'EnvironmentConfigError';
  }
}

export class DeploymentValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DEPLOYMENT_VALIDATION_ERROR', 500, details);
    this.name = 'DeploymentValidationError';
  }
}

export class DatabaseConnectionError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DB_CONNECTION_ERROR', 500, details);
    this.name = 'DatabaseConnectionError';
  }
}

export class PortBindingError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PORT_BINDING_ERROR', 500, details);
    this.name = 'PortBindingError';
  }
}