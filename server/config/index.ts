import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { configSchema, portConfigSchema, Environment, type Config, type PortConfig } from './validation';
import { EnvironmentConfigError } from '../errors/index';

// Load environment variables first
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment detection utilities
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const currentEnvironment: Environment = isDevelopment ? Environment.Development : Environment.Production;

// Get environment-aware port configuration
function getPortConfig(): PortConfig {
  try {
    const defaultPort = 5000;
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : defaultPort;

    // Always bind to all interfaces (0.0.0.0) in development or Replit
    const host = '0.0.0.0';  // Simplified for consistency

    const config = { port, host };
    return portConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError(
        'Invalid port configuration', 
        { zodError: error.errors }
      );
    }
    throw new EnvironmentConfigError('Failed to configure port', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Build the configuration with validation
function buildConfig(): Config {
  try {
    const portConfig = getPortConfig();

    const config = {
      env: currentEnvironment,
      server: {
        ...portConfig,
        corsOrigins: [
          'http://localhost:5000',
          'http://127.0.0.1:5000',
          'http://0.0.0.0:5000',
          /\.repl\.co$/,
          ...(isDevelopment ? ['*'] : []),
        ],
      },
      database: {
        url: process.env.DATABASE_URL || '',
      },
    };

    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError(
        'Configuration validation failed', 
        { zodError: error.errors }
      );
    }
    throw new EnvironmentConfigError('Failed to build configuration', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Export the validated configuration
export const config = buildConfig();

// Export types and utilities
export { Environment, type Config, type PortConfig };