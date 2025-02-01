/**
 * Base validator module
 * @module validators/base
 */

import { EnvironmentConfig } from '../environments/types';
import { DeploymentValidationError } from '../../errors/environment';

/**
 * Interface for validation results
 */
export interface ValidationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Base validator class that all specific validators should extend
 */
export abstract class BaseValidator {
  protected config: EnvironmentConfig;
  protected debug: boolean;
  private validatorName: string;

  constructor(config: EnvironmentConfig) {
    this.config = config;
    this.debug = config.debug?.verbose ?? false;
    this.validatorName = this.constructor.name;
  }

  /**
   * Validate the specific aspect of the environment
   * @throws {DeploymentValidationError} If validation fails
   */
  abstract validate(): Promise<ValidationResult>;

  /**
   * Log debug information if debug mode is enabled
   */
  protected log(message: string, data?: Record<string, unknown>): void {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      const logPrefix = `[${timestamp}] [${this.validatorName}]`;

      if (data) {
        console.log(`${logPrefix} ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${logPrefix} ${message}`);
      }
    }
  }

  /**
   * Create a validation error with standardized format
   */
  protected createError(
    message: string,
    details?: Record<string, unknown>
  ): DeploymentValidationError {
    const errorDetails = {
      validator: this.validatorName,
      environment: this.config.name,
      timestamp: new Date().toISOString(),
      ...details
    };

    this.log(`Validation Error: ${message}`, errorDetails);

    return new DeploymentValidationError(
      `[${this.validatorName}] ${message}`,
      errorDetails
    );
  }

  /**
   * Helper method to validate required environment variables
   */
  protected validateRequiredEnvVars(vars: string[]): void {
    const missingVars = vars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      throw this.createError(
        'Missing required environment variables',
        {
          missing: missingVars,
          required: vars,
          suggestions: [
            'Check your .env file',
            'Verify environment variables are set correctly',
            'Refer to documentation for required variables'
          ]
        }
      );
    }
  }

  /**
   * Helper method to validate a port number
   */
  protected validatePort(port: number | string): number {
    const parsedPort = typeof port === 'string' ? parseInt(port, 10) : port;

    if (isNaN(parsedPort) || parsedPort < 1024 || parsedPort > 65535) {
      throw this.createError(
        'Invalid port number',
        {
          port: parsedPort,
          valid_range: '1024-65535',
          suggestions: [
            'Use a port number between 1024 and 65535',
            'Check if port is specified correctly',
            'Ensure port is not blocked by system'
          ]
        }
      );
    }

    return parsedPort;
  }
}