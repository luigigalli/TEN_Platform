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
        console.warn('[config] Invalid REPL_URL format:', val);
        return null;
      }
    }),
  WINDSURF_ENV: z.string().optional(),

  // Server configuration
  PORT: z.string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().min(1024).max(65535))
    .optional()
    .default('3000'),
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
    const env = envSchema.parse(process.env);

    // Enhanced logging in development
    if (env.NODE_ENV === 'development') {
      console.log('[config] Environment variables loaded successfully');
      console.log('[config] Platform:', env.REPL_ID ? 'Replit' : env.WINDSURF_ENV ? 'Windsurf' : 'Local');
      if (env.REPL_ID) {
        console.log('[config] Replit URL:', env.REPL_URL || 'Not configured');
        if (env.REPL_URL) {
          console.log('[config] Replit Dev URL:', getReplitDevDomain() || 'Not available');
        }
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
      error: error instanceof Error ? error.message : String(error),
      tip: "Check your .env file and environment configuration."
    });
  }
}

// Export validated environment variables
export const env = loadEnvVars();

// Environment detection utilities
export const isReplit = Boolean(env.REPL_ID);
export const isWindsurf = Boolean(env.WINDSURF_ENV);
export const isDevelopment = env.NODE_ENV === 'development';

// Get the Replit Dev URL for CORS and logging
export function getReplitDevDomain(): string | null {
  return env.REPL_URL;
}

// Get the external URL for server logging
export function getExternalUrl(port: number): string {
  if (isReplit && env.REPL_URL) {
    // For Replit, only append port if it's not the default (3000)
    const baseUrl = env.REPL_URL;
    return port === 3000 ? baseUrl : `${baseUrl}:${port}`;
  }
  
  if (isWindsurf) {
    return `http://localhost:${port}`;
  }
  
  return `http://localhost:${port}`;
}