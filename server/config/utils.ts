import { z } from 'zod';

// Environment definitions
export const ENVIRONMENT = {
  Development: 'development',
  Production: 'production',
  Test: 'test'
} as const;

export type Environment = (typeof ENVIRONMENT)[keyof typeof ENVIRONMENT];

// Environment detection utilities
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isWindsurf = Boolean(process.env.WINDSURF_ENV);
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const currentEnvironment: Environment = 
  (process.env.NODE_ENV as Environment) || 
  (isDevelopment ? ENVIRONMENT.Development : ENVIRONMENT.Production);

// Get the appropriate host based on environment
export const getAppropriateHost = () => {
  if (isReplit) {
    return '0.0.0.0'; // Use 0.0.0.0 for Replit
  }
  if (isWindsurf) {
    return 'localhost'; // Use localhost for Windsurf
  }
  return isDevelopment ? 'localhost' : '0.0.0.0'; // Default behavior
};

// Port configuration schema with enhanced validation
export const portConfigSchema = z.object({
  port: z.coerce
    .number()
    .int()
    .min(1024, "Port must be >= 1024 (non-privileged ports)")
    .max(65535, "Port must be <= 65535")
    .default(5000)
    .describe('The port number to run the server on'),
  host: z.string()
    .min(1, "Host cannot be empty")
    .default(getAppropriateHost())
    .describe('The host to bind the server to'),
});

// Export types
export type PortConfig = z.infer<typeof portConfigSchema>;