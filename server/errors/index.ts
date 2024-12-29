/**
 * Centralized error handling for the server
 * All error classes should be exported from this file
 */

// Re-export the base error class
export { ServerError } from './base';

// Re-export environment specific errors
export { EnvironmentConfigError, PortConfigError, DatabaseConfigError } from './environment';