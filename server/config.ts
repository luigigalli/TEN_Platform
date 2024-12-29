import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError, PortConfigError } from './errors/index';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment detection
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';

// Port configuration schema with enhanced validation
const portConfigSchema = z.object({
  port: z.coerce.number().int().min(1024).max(65535),
  host: z.string().min(1),
});

type PortConfig = z.infer<typeof portConfigSchema>;

// Environment-aware port configuration
function getPortConfig(): PortConfig {
  try {
    // Default port is 5000 (compatible with Replit)
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    // Always bind to all network interfaces in Replit or development
    const host = isReplit || isDevelopment ? '0.0.0.0' : (process.env.HOST || 'localhost');

    const config = { port, host };
    return portConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new PortConfigError(
        'Invalid port configuration',
        0,
        { zodError: error.errors }
      );
    }
    throw new EnvironmentConfigError('Failed to load port configuration');
  }
}

// Environment configuration schema
const configSchema = z.object({
  database: z.object({
    url: z.string().min(1),
  }),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
    corsOrigins: z.array(z.string().or(z.instanceof(RegExp))),
  }),
  env: z.enum(['development', 'production']).default('development'),
});

// Configuration object
export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    ...getPortConfig(),
    corsOrigins: [
      // Allow local development
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://0.0.0.0:5000',
      // Allow Replit domains
      /\.repl\.co$/,
      // Allow all during development
      ...(isDevelopment ? ['*'] : []),
    ],
  },
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
};

// Validate configuration
try {
  configSchema.parse(config);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:', error.errors);
    process.exit(1);
  } else {
    console.error('Configuration error:', error);
    process.exit(1);
  }
}

export default config;