import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError } from '../errors';
import crypto from 'crypto';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

// Environment type definition
export const Environment = {
  Development: 'development',
  Production: 'production',
  Test: 'test'
} as const;

export type Environment = typeof Environment[keyof typeof Environment];

// Environment detection utilities
export const isReplit = Boolean(process.env.REPL_ID);
export const isWindsurf = Boolean(process.env.WINDSURF_ENV);
export const isDevelopment = process.env.NODE_ENV === 'development';

// Get the default port based on environment
const getDefaultPort = () => {
  if (isReplit) return 3000;
  return 3000;
};

// Get the default host based on environment
const getDefaultHost = () => {
  if (isReplit) return '0.0.0.0';
  return 'localhost';
};

// Get the default client port based on environment
const getDefaultClientPort = () => {
  return 5173;
};

// Environment variables schema with validation
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .optional()
    .default('development'),

  // Platform detection
  REPL_ID: z.string().optional(),
  REPL_OWNER: z.string().optional(),
  REPL_SLUG: z.string().optional(),
  REPL_URL: z.string()
    .optional()
    .transform(val => {
      if (!val) return null;
      try {
        // Always use HTTPS for Replit URLs
        const url = !val.startsWith('http') ? `https://${val}` : val;
        // Ensure we get just the origin
        return new URL(url).origin;
      } catch {
        return null;
      }
    }),

  // Server configuration
  PORT: z.coerce.number()
    .optional()
    .default(getDefaultPort()),
  
  HOST: z.string()
    .optional()
    .default(getDefaultHost()),

  // Client configuration
  CLIENT_PORT: z.coerce.number()
    .optional()
    .default(getDefaultClientPort()),

  // External ports (for Replit)
  EXTERNAL_PORT: z.coerce.number()
    .optional()
    .default(getDefaultPort()),
  
  EXTERNAL_CLIENT_PORT: z.coerce.number()
    .optional()
    .default(80),

  // Windsurf environment
  WINDSURF_ENV: z.string().optional(),
});

export type EnvVars = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 */
function loadEnvVars(): EnvVars {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError(
        'Invalid environment configuration',
        'ENV_VALIDATION_ERROR',
        400,
        { details: error.errors }
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = loadEnvVars();

/**
 * Get the Replit Dev URL for CORS and logging
 */
export function getReplitDevDomain(): string | null {
  if (!isReplit || !env.REPL_URL) return null;
  return env.REPL_URL;
}

/**
 * Get the external URL for server logging
 */
export function getExternalUrl(port: number): string {
  if (isReplit && env.REPL_URL) {
    // In Replit, never append the port to the URL
    return env.REPL_URL;
  }

  const host = env.HOST === '0.0.0.0' ? 'localhost' : env.HOST;
  const protocol = host === 'localhost' ? 'http' : 'https';
  return `${protocol}://${host}:${port}`;
}