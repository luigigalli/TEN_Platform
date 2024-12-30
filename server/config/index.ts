import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError, PortConfigError } from '../errors';
import { 
  ENVIRONMENT,
  currentEnvironment,
  isDevelopment,
  isReplit,
  isWindsurf,
  type Environment
} from './utils';

// Load environment variables in development
if (isDevelopment) {
  dotenv();
}

// Server configuration schema with enhanced validation
const serverConfigSchema = z.object({
  port: z.coerce
    .number()
    .int()
    .min(1024, "Port must be >= 1024 (non-privileged ports)")
    .max(65535, "Port must be <= 65535")
    .default(5000),
  host: z.string()
    .min(1, "Host cannot be empty")
    .default(isReplit ? '0.0.0.0' : 'localhost'),
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
 */
function buildConfig(): Config {
  try {
    // Get port from environment or use default (5000)
    const port = parseInt(process.env.PORT || '5000', 10);

    // Determine host based on environment
    const host = process.env.HOST || (isReplit ? '0.0.0.0' : 'localhost');

    // Default configuration
    const config = {
      env: currentEnvironment,
      server: {
        port,
        host,
        corsOrigins: isDevelopment 
          ? ['*']
          : [
              `http://${host}:${port}`,
              'http://localhost:5000',
              'http://127.0.0.1:5000',
              /\.repl\.co$/,
            ],
      },
      database: {
        url: process.env.DATABASE_URL || '',
      },
    };

    // Validate configuration
    const validated = configSchema.parse(config);

    // Additional port validation
    if (validated.server.port < 1024) {
      throw new PortConfigError(
        'Port number must be >= 1024 (non-privileged ports)',
        validated.server.port
      );
    }

    // Log configuration in development for debugging
    if (isDevelopment) {
      console.log('[config] Environment:', validated.env);
      console.log('[config] Server:', {
        port: validated.server.port,
        host: validated.server.host,
        environment: isReplit ? 'Replit' : isWindsurf ? 'Windsurf' : 'Local'
      });
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