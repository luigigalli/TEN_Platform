/**
 * Environment verification script
 * Helps developers verify their environment setup and troubleshoot issues
 */

import { validateDeploymentEnvironment, performHealthCheck } from '../server/config/deployment-validator';
import { detectEnvironment } from '../server/config/environments';
import { env } from '../server/config/environment';
import chalk from 'chalk';

async function verifyEnvironment() {
  console.log(chalk.blue('\nEnvironment Verification Tool'));
  console.log(chalk.blue('============================\n'));

  try {
    // 1. Detect Environment
    const config = detectEnvironment();
    console.log(chalk.green('✓ Detected Environment:'), chalk.white(config.name));
    console.log(chalk.gray('  - NODE_ENV:'), chalk.white(env.NODE_ENV));
    
    // 2. Environment Variables
    const envVars = {
      'Database URL': process.env.DATABASE_URL?.replace(/:.*@/, ':***@'),
      'Host': env.HOST,
      'Port': env.PORT,
      'Client Port': env.CLIENT_PORT,
    };

    console.log(chalk.green('\n✓ Environment Variables:'));
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(chalk.gray(`  - ${key}:`), chalk.white(value || 'Not set'));
    });

    // 3. Run Validation
    console.log(chalk.blue('\nRunning Validation Checks...'));
    await validateDeploymentEnvironment();
    console.log(chalk.green('\n✓ All validation checks passed\n'));

    // 4. Perform Health Check
    console.log(chalk.blue('Running Health Check...'));
    const isHealthy = await performHealthCheck();
    
    if (isHealthy) {
      console.log(chalk.green('\n✓ System is healthy and ready for development\n'));
    } else {
      throw new Error('Health check failed');
    }

  } catch (error) {
    console.log(chalk.red('\n✗ Environment verification failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    
    // Provide troubleshooting hints
    console.log(chalk.yellow('\nTroubleshooting Steps:'));
    console.log(chalk.gray('1. Verify your .env file configuration'));
    console.log(chalk.gray('2. Check database connection and credentials'));
    console.log(chalk.gray('3. Ensure required ports are available'));
    console.log(chalk.gray('4. Review docs/environment.md for environment-specific requirements\n'));
    
    process.exit(1);
  }
}

// Run verification
verifyEnvironment();
