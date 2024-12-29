/**
 * Centralized error handling system
 * Single source of truth for all application errors
 */

// Export all error classes from base-error
export * from './base-error';

// No need to export from these files anymore, they just need to exist
// for backward compatibility
import './deprecated';
import './environment';
import './types';
import './base';
import './errors';