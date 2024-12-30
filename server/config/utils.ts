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

// Get current environment with enhanced detection
export function getCurrentEnvironment(): Environment {
  if (process.env.NODE_ENV === 'production') {
    return ENVIRONMENT.Production;
  }
  if (process.env.NODE_ENV === 'test') {
    return ENVIRONMENT.Test;
  }
  return ENVIRONMENT.Development;
}

// Enhanced environment-specific host configuration
export function getAppropriateHost(): string {
  // Force 0.0.0.0 for Replit to ensure proper binding
  if (isReplit) {
    return '0.0.0.0';
  }

  // Use environment variable if specified
  if (process.env.HOST) {
    return process.env.HOST;
  }

  // Use localhost for Windsurf and local development
  return isWindsurf ? 'localhost' : '0.0.0.0';
}

// Enhanced environment-specific port configuration
export function getAppropriatePort(): number {
  // Try environment variable first
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (!isNaN(port) && port >= 1024 && port <= 65535) {
      return port;
    }
    console.warn('Invalid PORT environment variable, using default port 5000');
  }

  // Default ports based on environment
  if (isReplit) {
    return 5000; // Replit standard port
  }

  return isWindsurf ? 5000 : 5000; // Both Windsurf and local use 5000
}

// Enhanced server configuration schema with environment awareness
export const serverConfigSchema = z.object({
  port: z.number()
    .int()
    .min(1024, "Port must be >= 1024 (non-privileged ports)")
    .max(65535, "Port must be <= 65535")
    .default(getAppropriatePort()),
  host: z.string()
    .min(1, "Host cannot be empty")
    .default(getAppropriateHost())
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;