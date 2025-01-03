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

  constructor(config: EnvironmentConfig) {
    this.config = config;
    this.debug = config.debug?.verbose ?? false;
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
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  /**
   * Create a validation error with standardized format
   */
  protected createError(message: string, details?: Record<string, unknown>): DeploymentValidationError {
    return new DeploymentValidationError(
      `[${this.constructor.name}] ${message}`,
      details
    );
  }
}
