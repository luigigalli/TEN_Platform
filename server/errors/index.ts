/**
 * Centralized error handling for the server
 * All error exports should come from this file
 */

// Base error types
export { ServerError, ConfigError } from './types';

// Environment-specific errors
export { 
  EnvironmentConfigError,
  PortConfigError,
  DatabaseConfigError 
} from './environment';