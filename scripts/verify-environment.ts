/**
 * Environment verification script
 * This script runs all environment validators and reports results
 */

import { validateDeploymentEnvironment } from '../server/config/deployment-validator';
import { detectEnvironment } from '../server/config/environments';
import { env } from '../server/config/environment';
import chalk from 'chalk';

async function verifyEnvironment() {
  console.log(chalk.blue('\nEnvironment Verification Tool'));
  console.log(chalk.blue('============================\n'));

  try {
    // 1. Detect Environment
    const config = detectEnvironment();
    console.log(chalk.green('✓ Environment Configuration:'));
    console.log(chalk.gray('  - Environment:'), chalk.white(config.name));
    console.log(chalk.gray('  - NODE_ENV:'), chalk.white(env.NODE_ENV));

    // 2. Environment Variables
    const envVars = {
      'Database URL': process.env.DATABASE_URL?.replace(/:.*@/, ':***@'),
      'Host': env.HOST,
      'Port': env.PORT,
      'External Port': env.EXTERNAL_PORT,
      'Client Port': env.CLIENT_PORT
    };

    console.log(chalk.green('\n✓ Environment Variables:'));
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(chalk.gray(`  - ${key}:`), chalk.white(value || 'Not set'));
    });

    // 3. Run Validation
    console.log(chalk.blue('\nRunning Environment Validation...'));
    await validateDeploymentEnvironment();
    console.log(chalk.green('\n✓ All validation checks passed'));

    // 4. Additional Environment Info
    if (config.debug?.verbose) {
      console.log(chalk.yellow('\nDebug Information:'));
      console.log(chalk.gray('  - Debug Mode:'), chalk.white('Enabled'));
      if (config.debug.additionalInfo) {
        Object.entries(config.debug.additionalInfo).forEach(([key, value]) => {
          console.log(chalk.gray(`  - ${key}:`), chalk.white(value));
        });
      }
    }

    console.log(chalk.green('\n✓ Environment is properly configured and ready'));

  } catch (error) {
    console.log(chalk.red('\n✗ Environment verification failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));

    // Provide troubleshooting hints
    console.log(chalk.yellow('\nTroubleshooting Steps:'));
    console.log(chalk.gray('1. Verify your .env file configuration'));
    console.log(chalk.gray('2. Check database connection and credentials'));
    console.log(chalk.gray('3. Ensure required ports are available'));
    console.log(chalk.gray('4. Review docs/environment.md for environment setup'));

    process.exit(1);
  }
}

// Run verification
verifyEnvironment();