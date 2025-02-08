/**
 * Centralized error handling system
 * Single source of truth for all application errors
 */

// Export all error classes from base-error and environment
export * from './base-error';
export * from './environment';
export * from './auth';

// No need to export from these files anymore, they just need to exist
// for backward compatibility
import './deprecated';
import './types';
import './base';
import './errors';