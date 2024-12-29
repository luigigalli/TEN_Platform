/**
 * Centralized error handling for the server
 * Re-exports all error classes
 */
export { ServerError } from './base';

// Export environment-specific errors
export { EnvironmentConfigError, PortConfigError, DatabaseConfigError } from './environment';