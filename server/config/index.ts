import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError } from '../errors';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment definitions and detection
const ENV = {
  Development: 'development',
  Production: 'production',
} as const;

export type Environment = (typeof ENV)[keyof typeof ENV];

export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const currentEnvironment: Environment = isDevelopment 
  ? ENV.Development 
  : ENV.Production;

// Configuration schemas
const portConfigSchema = z.object({
  port: z.coerce.number().int().min(1024).max(65535).default(5000),
  host: z.string().min(1).default('0.0.0.0'),
});

const serverConfigSchema = z.object({
  port: portConfigSchema.shape.port,
  host: portConfigSchema.shape.host,
  corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
});

const configSchema = z.object({
  env: z.nativeEnum(ENV),
  server: serverConfigSchema,
  database: z.object({
    url: z.string().min(1),
  }),
});

// Type exports
export type Config = z.infer<typeof configSchema>;
export type PortConfig = z.infer<typeof portConfigSchema>;

// Build configuration
function buildConfig(): Config {
  try {
    const config = {
      env: currentEnvironment,
      server: {
        port: 5000,
        host: '0.0.0.0',
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
      throw new EnvironmentConfigError('Invalid configuration', { zodError: error.errors });
    }
    throw new EnvironmentConfigError('Failed to build configuration');
  }
}

// Export validated configuration
export const config = buildConfig();

// Export environment enum for external use
export { ENV };