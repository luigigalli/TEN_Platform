/**
 * Type definitions for environment configurations
 * @module environments/types
 */

/**
 * Database configuration requirements for an environment
 */
export interface DatabaseConfig {
  /** Expected prefix for database URLs (e.g., 'postgresql://' or 'postgres://') */
  urlPrefix: string[];
  /** Whether SSL is required for database connections */
  requireSSL: boolean;
  /** Default connection pool settings */
  poolConfig: {
    maxConnections: number;
    idleTimeout: number;
  };
}

/**
 * Server configuration requirements for an environment
 */
export interface ServerConfig {
  /** Default port number for the environment */
  defaultPort: number;
  /** Allowed host addresses */
  allowedHosts: string[];
  /** CORS configuration */
  cors: {
    origins: Array<string | RegExp>;
  };
}

/**
 * Environment-specific configuration requirements
 */
export interface EnvironmentConfig {
  /** Name of the environment */
  name: 'replit' | 'windsurf' | 'local';
  /** Required environment variables */
  requiredVars: string[];
  /** Database configuration */
  database: DatabaseConfig;
  /** Server configuration */
  server: ServerConfig;
  /** Debug mode configuration */
  debug?: {
    /** Whether to enable verbose logging */
    verbose: boolean;
    /** Additional debug information */
    additionalInfo?: Record<string, unknown>;
  };
}

/**
 * Environment detection results
 */
export interface EnvironmentDetection {
  /** Current environment name */
  current: EnvironmentConfig['name'];
  /** Whether running in development mode */
  isDevelopment: boolean;
  /** Environment-specific variables */
  variables: Record<string, string | undefined>;
}