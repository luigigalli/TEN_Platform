import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError, PortConfigError } from '../errors';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment definitions
const ENVIRONMENT = {
  Development: 'development',
  Production: 'production',
} as const;

export type Environment = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

// Environment detection utilities
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const currentEnvironment: Environment = isDevelopment ? ENVIRONMENT.Development : ENVIRONMENT.Production;

// Port configuration schema with enhanced validation
const portConfigSchema = z.object({
  port: z.coerce
    .number()
    .int()
    .min(1024, "Port must be >= 1024 (non-privileged ports)")
    .max(65535, "Port must be <= 65535")
    .default(5000),
  host: z.string()
    .min(1, "Host cannot be empty")
    .default('0.0.0.0'),
});

// Server configuration schema
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

// Type exports
export type Config = z.infer<typeof configSchema>;
export type PortConfig = z.infer<typeof portConfigSchema>;

// Build configuration with environment awareness
function buildConfig(): Config {
  try {
    // Default configuration based on environment
    const config = {
      env: currentEnvironment,
      server: {
        // For consistency across environments, we'll always use port 5000
        // This ensures compatibility with Replit's environment
        port: Number(process.env.PORT) || 5000,
        host: process.env.HOST || '0.0.0.0',
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

    const validated = configSchema.parse(config);

    // Additional port validation for security
    if (validated.server.port < 1024) {
      throw new PortConfigError(
        'Port number must be >= 1024 (non-privileged ports)',
        validated.server.port
      );
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

// Export environment enum for external use
export { ENVIRONMENT as ENV };