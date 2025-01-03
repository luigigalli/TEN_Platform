/**
 * Deployment Environment Validator
 * @module config/deployment-validator
 */

import { detectEnvironment } from './environments';
import { EnvironmentValidator } from './validators/environment';
import { DatabaseValidator } from './validators/database';
import { ServerValidator } from './validators/server';
import { ValidationResult } from './validators/base';
import { DeploymentValidationError } from '../errors/environment';
import { env, isReplit } from './environment';

/**
 * Validates the complete deployment environment
 * This function runs all necessary validation checks for the current environment
 * @throws {DeploymentValidationError} If any validation check fails
 */
export async function validateDeploymentEnvironment(): Promise<void> {
  console.log('[Deployment] Starting environment validation...');
  const results: ValidationResult[] = [];

  try {
    // Detect current environment
    const config = detectEnvironment();
    console.log(`[Deployment] Detected environment: ${config.name}`);
    console.log(`[Deployment] Running in ${env.NODE_ENV} mode`);
    console.log(`[Deployment] Platform: ${isReplit ? 'Replit' : 'Windsurf/Local'}`);

    // Create validators with enhanced logging
    const validators = [
      new EnvironmentValidator(config),
      new DatabaseValidator(config),
      new ServerValidator(config)
    ];

    // Run all validations with detailed progress reporting
    for (const validator of validators) {
      try {
        console.log(`\n[Deployment] Running ${validator.constructor.name}...`);
        const result = await validator.validate();
        results.push(result);

        // Log validation success with details
        console.log(`[Deployment] ✓ ${result.message}`);
        if (result.details) {
          console.log('[Deployment] Details:', JSON.stringify(result.details, null, 2));
        }
      } catch (error) {
        // Enhanced error reporting with troubleshooting hints
        console.error(`\n[Deployment] ✗ ${validator.constructor.name} failed:`);

        if (error instanceof DeploymentValidationError) {
          console.error(`[Deployment] Error: ${error.message}`);
          if (error.details) {
            console.error('[Deployment] Details:', JSON.stringify(error.details, null, 2));
          }

          // Add troubleshooting hints based on validator type
          if (validator instanceof DatabaseValidator) {
            console.error('\n[Deployment] Troubleshooting steps:');
            console.error('1. Verify DATABASE_URL environment variable');
            console.error('2. Check database connection and credentials');
            console.error('3. Ensure database server is running');
            console.error('4. Verify SSL settings for your environment');
          } else if (validator instanceof ServerValidator) {
            console.error('\n[Deployment] Troubleshooting steps:');
            console.error('1. Check if port is available');
            console.error('2. Verify host configuration');
            console.error('3. Check for conflicting services');
          }

          throw error;
        }

        throw new DeploymentValidationError(
          `Validation failed in ${validator.constructor.name}`,
          { 
            error: error instanceof Error ? error.message : String(error),
            validator: validator.constructor.name,
            environment: config.name,
            nodeEnv: env.NODE_ENV
          }
        );
      }
    }

    console.log('\n[Deployment] ✓ All validation checks passed successfully');
    console.log('[Deployment] Environment is ready for development/deployment');

  } catch (error) {
    console.error('\n[Deployment] ✗ Validation failed:', error);
    console.error('\n[Deployment] Please check the documentation at docs/environment-guide.md for troubleshooting steps.');
    throw error;
  }
}

/**
 * Perform a health check of the deployment environment
 * @returns {Promise<boolean>} True if all checks pass, false otherwise
 */
export async function performHealthCheck(): Promise<boolean> {
  try {
    await validateDeploymentEnvironment();
    return true;
  } catch (error) {
    console.error('\n[Health Check] Failed:', error);
    console.error('[Health Check] Run npm run verify-env for detailed diagnostics');
    return false;
  }
}

// Export for use in server initialization
export async function initializeServer() {
    await validateDeploymentEnvironment();
    // Server initialization continues...
}