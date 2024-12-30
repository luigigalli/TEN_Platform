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
  REPL_URL: z.string().optional(), // Added for Replit URL support
  WINDSURF_ENV: z.string().optional(),

  // Server configuration
  PORT: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1024).max(65535))
    .optional()
    .default('5000'),
  HOST: z.string().min(1).optional().default('0.0.0.0'),

  // Database configuration
  DATABASE_URL: z.string()
    .min(1, "Database URL is required")
    .catch("postgresql://postgres:postgres@localhost:5432/postgres"),

  // API keys and secrets
  SESSION_SECRET: z.string()
    .optional()
    .default(() => crypto.randomUUID()),
});

export type EnvVars = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables with enhanced error handling
 */
export function loadEnvVars(): EnvVars {
  try {
    // First try loading from .env file in development
    if (process.env.NODE_ENV !== 'production') {
      dotenv();
    }

    const env = envSchema.parse(process.env);

    // Enhanced logging in development
    if (env.NODE_ENV === 'development') {
      console.log('[config] Environment variables loaded successfully');
      console.log('[config] Platform:', env.REPL_ID ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local');
      if (env.REPL_ID && env.REPL_URL) {
        console.log('[config] Replit Dev URL:', env.REPL_URL);
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));

      throw new EnvironmentConfigError(
        'Missing or invalid environment variables',
        {
          validationErrors: error.errors,
          missingVariables: missingVars,
          tip: "Make sure all required environment variables are set. In development, you can use a .env file."
        }
      );
    }

    throw new EnvironmentConfigError('Failed to load environment variables', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Export validated environment variables
export const env = loadEnvVars();

// Environment detection utilities
export const isReplit = Boolean(env.REPL_ID && env.REPL_OWNER);
export const isWindsurf = Boolean(env.WINDSURF_ENV);
export const isDevelopment = env.NODE_ENV === 'development';

// Get the Replit Dev URL domain for CORS
export const getReplitDevDomain = () => {
  if (env.REPL_URL) {
    try {
      const url = new URL(env.REPL_URL);
      return url.origin;
    } catch {
      return null;
    }
  }
  return null;
};