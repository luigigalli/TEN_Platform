/**
 * Configuration Management System
 * 
 * This module provides a centralized configuration system that handles both Replit and Windsurf
 * development environments. It implements environment-aware settings for cross-platform development.
 * 
 * Environment Detection:
 * - Replit: Detected by checking REPL_ID and REPL_OWNER environment variables
 * - Windsurf: Local development environment (when not in Replit)
 * 
 * Port Configuration Strategy:
 * - Replit: Uses port 5000 (required by Replit's architecture)
 * - Windsurf: Uses port 3000 (standard development port)
 * - Custom: Can be overridden via PORT environment variable
 * 
 * CORS Configuration:
 * - Allows localhost development in Windsurf
 * - Supports Replit domains
 * - Dynamically adjusts based on the current port
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { EnvironmentConfigError, PortConfigError } from './errors/environment';

// Load environment variables from .env file in development
dotenv.config();

// Environment detection
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isWindsurf = !isReplit;
export const isDevelopment = process.env.NODE_ENV !== 'production';

// Port configuration
const WINDSURF_PORT = 3000;  // Standard development port for local environment
const REPLIT_PORT = 5000;    // Required port for Replit environment

/**
 * Determines the appropriate port based on the current environment
 * Priority:
 * 1. PORT environment variable (if set)
 * 2. Environment-specific default (REPLIT_PORT or WINDSURF_PORT)
 */
function determinePort(): number {
  try {
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT, 10);
      if (isNaN(port) || port < 1) {
        throw new PortConfigError(
          'Invalid PORT environment variable',
          port,
          { reason: 'Port must be a positive number' }
        );
      }
      return port;
    }

    // Use environment-specific default ports
    const port = isReplit ? REPLIT_PORT : WINDSURF_PORT;

    // Validate port availability
    if (isReplit && port !== REPLIT_PORT) {
      throw new PortConfigError(
        'Invalid port configuration for Replit environment',
        port,
        { expected: REPLIT_PORT }
      );
    }

    return port;
  } catch (error) {
    if (error instanceof PortConfigError) {
      throw error;
    }
    throw new PortConfigError(
      'Failed to determine port',
      -1,
      { originalError: error }
    );
  }
}

// Environment configuration schema
const configSchema = z.object({
  database: z.object({
    url: z.string().min(1),
  }),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string().default('0.0.0.0'),
    corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  }),
  env: z.enum(['development', 'production']).default('development'),
});

// Configuration object
export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: determinePort(),
    host: '0.0.0.0',  // Bind to all network interfaces for both environments
    corsOrigins: [
      // Dynamic port-aware origins for local development
      `http://localhost:${determinePort()}`,
      `http://127.0.0.1:${determinePort()}`,
      `http://0.0.0.0:${determinePort()}`,
      // Replit-specific domains
      /\.repl\.co$/,
      // Windsurf-specific configuration (only added in Windsurf environment)
      isWindsurf && new RegExp(`^http://.*:${determinePort()}$`),
    ].filter(Boolean) as (string | RegExp)[],
  },
  env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
};

// Validate configuration
try {
  configSchema.parse(config);
} catch (error) {
  throw new EnvironmentConfigError(
    'Invalid configuration',
    { validationError: error }
  );
}