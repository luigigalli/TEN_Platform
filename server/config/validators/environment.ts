/**
 * Environment validator module
 * @module validators/environment
 */

import { BaseValidator, ValidationResult } from './base';
import { EnvironmentConfig } from '../environments/types';

/**
 * Validates environment-specific configuration requirements
 * @example
 * ```typescript
 * const config = detectEnvironment();
 * const validator = new EnvironmentValidator(config);
 * await validator.validate();
 * ```
 */
export class EnvironmentValidator extends BaseValidator {
  constructor(config: EnvironmentConfig) {
    super(config);
  }

  async validate(): Promise<ValidationResult> {
    this.log('Starting environment validation');

    // Check required environment variables
    const missingVars = this.config.requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw this.createError(
        `Missing required environment variables for ${this.config.name} environment`,
        { missingVars }
      );
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (!['development', 'production', 'test'].includes(nodeEnv)) {
      throw this.createError('Invalid NODE_ENV', {
        current: nodeEnv,
        allowed: ['development', 'production', 'test']
      });
    }

    this.log('Environment validation passed');
    return {
      success: true,
      message: `Environment validation passed for ${this.config.name}`,
      details: {
        environment: this.config.name,
        nodeEnv,
        debug: this.debug
      }
    };
  }
}
