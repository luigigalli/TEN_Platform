import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError, PortConfigError } from '../errors';
import { 
  ENVIRONMENT,
  currentEnvironment,
  isDevelopment,
  portConfigSchema,
  type Environment
} from './utils';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Server configuration schema with enhanced validation
const serverConfigSchema = z.object({
  port: portConfigSchema.shape.port,
  host: portConfigSchema.shape.host,
  corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
});

// Main configuration schema
const configSchema = z.object({
  env: z.nativeEnum(ENVIRONMENT),
  server: serverConfigSchema,
  database: z.object({
    url: z.string().min(1),
  }),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Build configuration with environment awareness
 * 
 * Environment Variables:
 * - NODE_ENV: 'development' | 'production' | 'test' (default: 'development')
 * - PORT: number (default: 5000)
 * - HOST: string (default: '0.0.0.0')
 * - DATABASE_URL: string (required)
 */
function buildConfig(): Config {
  try {
    // Parse and validate environment variables
    const port = parseInt(process.env.PORT || '5000', 10);
    const host = process.env.HOST || '0.0.0.0';

    // Default configuration based on environment
    const config = {
      env: currentEnvironment,
      server: {
        port,
        host,
        corsOrigins: isDevelopment 
          ? ['*']  // Allow all origins in development
          : [
              'http://localhost:5000',
              'http://127.0.0.1:5000',
              'http://0.0.0.0:5000',
              /\.repl\.co$/,
            ],
      },
      database: {
        url: process.env.DATABASE_URL || '',
      },
    };

    // Validate configuration against schema
    const validated = configSchema.parse(config);

    // Additional port validation for security
    if (validated.server.port < 1024) {
      throw new PortConfigError(
        'Port number must be >= 1024 (non-privileged ports)',
        validated.server.port
      );
    }

    // Log configuration in development
    if (isDevelopment) {
      console.log(`[config] Environment: ${validated.env}`);
      console.log(`[config] Port: ${validated.server.port}`);
      console.log(`[config] Host: ${validated.server.host}`);
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError('Invalid configuration', { zodError: error.errors });
    }
    if (error instanceof PortConfigError) {
      throw error;
    }
    throw new EnvironmentConfigError('Failed to build configuration');
  }
}

// Export validated configuration
export const config = buildConfig();

// Export environment utilities
export { ENVIRONMENT as ENV };
export type { Environment };