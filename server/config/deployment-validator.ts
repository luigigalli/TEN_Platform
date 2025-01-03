import { z } from 'zod';
import { env, isReplit } from './environment';
import { validatePort, validateDatabaseConfig, validateEnvironment } from './validation';
import { DeploymentValidationError, DatabaseConnectionError, PortBindingError } from '../errors/environment';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import net from 'net';

/**
 * Validates that a port is available for binding
 */
async function validatePortAvailability(port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new PortBindingError(`Port ${port} is already in use`, { port }));
      } else {
        reject(new PortBindingError(`Error checking port ${port}: ${err.message}`, { 
          port,
          errorCode: err.code 
        }));
      }
    });

    server.once('listening', () => {
      server.close(() => resolve());
    });

    server.listen(port, host);
  });
}

/**
 * Validates database connectivity
 */
async function validateDatabaseConnection(): Promise<void> {
  try {
    // Test query to verify database connection and permissions
    const result = await db.execute(sql`
      SELECT current_database(), current_user, version()
    `);

    console.log('[Deployment] Database connection validated:', {
      database: result[0].current_database,
      user: result[0].current_user,
      version: result[0].version
    });
  } catch (error) {
    throw new DatabaseConnectionError('Failed to connect to database', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Validates the complete deployment environment
 */
export async function validateDeploymentEnvironment(): Promise<void> {
  console.log('[Deployment] Starting environment validation...');
  
  // 1. Validate environment type
  if (!validateEnvironment(env.NODE_ENV)) {
    throw new DeploymentValidationError('Invalid NODE_ENV', { 
      current: env.NODE_ENV,
      allowed: ['development', 'production', 'test']
    });
  }

  // 2. Validate port configuration
  if (!validatePort(env.PORT)) {
    throw new DeploymentValidationError('Invalid port configuration', {
      port: env.PORT
    });
  }

  // 3. Check port availability
  await validatePortAvailability(env.PORT, env.HOST);

  // 4. Validate database configuration
  const dbConfig = {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production',
    max_connections: 10,
    idle_timeout: 60
  };

  if (!validateDatabaseConfig(dbConfig)) {
    throw new DeploymentValidationError('Invalid database configuration');
  }

  // 5. Verify database connectivity
  await validateDatabaseConnection();

  // 6. Platform-specific checks
  if (isReplit) {
    if (!env.REPL_ID || !env.REPL_SLUG) {
      throw new DeploymentValidationError('Missing required Replit environment variables');
    }
  }

  console.log('[Deployment] Environment validation completed successfully');
}

/**
 * Perform health check of the deployment
 */
export async function performHealthCheck(): Promise<boolean> {
  try {
    // Basic health checks
    const checks = {
      database: await validateDatabaseConnection()
        .then(() => true)
        .catch(() => false),
      port: await validatePortAvailability(env.PORT, env.HOST)
        .then(() => true)
        .catch(() => false)
    };

    return Object.values(checks).every(Boolean);
  } catch (error) {
    console.error('[Health Check] Failed:', error);
    return false;
  }
}
