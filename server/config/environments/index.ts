/**
 * Environment configurations module
 * @module environments
 */

import { EnvironmentConfig } from './types';

/**
 * Replit environment configuration
 */
export const replitEnvironment: EnvironmentConfig = {
  name: 'replit',
  requiredVars: ['REPL_ID', 'REPL_SLUG'],
  database: {
    urlPrefix: ['postgresql://', 'postgres://'],
    requireSSL: true,
    poolConfig: {
      maxConnections: 10,
      idleTimeout: 60
    }
  },
  server: {
    defaultPort: 3001,
    allowedHosts: ['0.0.0.0'],
    cors: {
      origins: ['*']
    }
  },
  debug: {
    verbose: true,
    additionalInfo: {
      platform: 'Replit Cloud',
      documentation: 'https://docs.replit.com'
    }
  }
};

/**
 * Windsurf environment configuration
 */
export const windsurfEnvironment: EnvironmentConfig = {
  name: 'windsurf',
  requiredVars: ['WINDSURF_ENV'],
  database: {
    urlPrefix: ['postgresql://', 'postgres://'],
    requireSSL: false,
    poolConfig: {
      maxConnections: 5,
      idleTimeout: 30
    }
  },
  server: {
    defaultPort: 3000,
    allowedHosts: ['localhost', '127.0.0.1'],
    cors: {
      origins: [new RegExp('^https?://.*\\.windsurf\\.dev$')]
    }
  }
};

/**
 * Local development environment configuration
 */
export const localEnvironment: EnvironmentConfig = {
  name: 'local',
  requiredVars: [],
  database: {
    urlPrefix: ['postgresql://', 'postgres://'],
    requireSSL: false,
    poolConfig: {
      maxConnections: 5,
      idleTimeout: 30
    }
  },
  server: {
    defaultPort: 3000,
    allowedHosts: ['localhost', '127.0.0.1'],
    cors: {
      origins: ['http://localhost:3000', 'http://127.0.0.1:3000']
    }
  },
  debug: {
    verbose: true
  }
};

/**
 * Environment configurations registry
 */
export const environments = {
  replit: replitEnvironment,
  windsurf: windsurfEnvironment,
  local: localEnvironment
} as const;

/**
 * Get environment configuration based on current context
 * @returns Current environment configuration
 */
export function detectEnvironment(): EnvironmentConfig {
  if (process.env.REPL_ID) {
    return environments.replit;
  }
  if (process.env.WINDSURF_ENV) {
    return environments.windsurf;
  }
  return environments.local;
}