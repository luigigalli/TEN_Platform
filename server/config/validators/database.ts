/**
 * Database validator module
 * @module validators/database
 */

import { BaseValidator, ValidationResult } from './base';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { DatabaseConnectionError } from '../../errors/environment';
import { isReplit } from '../environment';

/**
 * Validates database configuration and connectivity
 */
export class DatabaseValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting database validation');

    try {
      // Verify DATABASE_URL exists and has correct format
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw this.createError('Missing DATABASE_URL environment variable', {
          tip: 'Ensure DATABASE_URL is set in your environment variables'
        });
      }

      // Log masked database URL for debugging
      this.log('Checking database URL', {
        url: dbUrl.replace(/:[^:]*@/, ':***@')
      });

      // Check if URL starts with any of the valid prefixes
      const validPrefixes = this.config.database.urlPrefix;
      const hasValidPrefix = validPrefixes.some(prefix => dbUrl.startsWith(prefix));

      if (!hasValidPrefix) {
        throw this.createError(
          `Invalid DATABASE_URL format for ${this.config.name} environment`,
          {
            expected: validPrefixes,
            received: dbUrl.split(':')[0],
            tip: 'DATABASE_URL must start with a valid prefix (postgresql:// or postgres://)'
          }
        );
      }

      // Test database connectivity with enhanced error handling
      try {
        // First try a basic connection test
        await db.execute(sql`SELECT 1`);
        this.log('Basic connectivity test passed');

        // Get connection details with simplified SSL check
        const [connDetails] = await db.execute(sql`
          SELECT 
            current_database() as db_name,
            current_user as user_name,
            version() as version,
            inet_server_addr() AS server_ip,
            (SELECT setting FROM pg_settings WHERE name = 'server_version_num') as version_num,
            (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()) as ssl_enabled
        `);

        if (!connDetails) {
          throw new Error('Could not retrieve database connection details');
        }

        const connectionInfo = {
          database: connDetails.db_name,
          user: connDetails.user_name,
          version: connDetails.version?.toString().split(' ')[0],
          serverIp: connDetails.server_ip,
          versionNum: connDetails.version_num,
          ssl: Boolean(connDetails.ssl_enabled)
        };

        this.log('Database connection successful', connectionInfo);

        // Check SSL based on environment
        if (process.env.NODE_ENV === 'production' && !connectionInfo.ssl && this.config.database.requireSSL) {
          throw this.createError('SSL connection required in production', {
            tip: 'Enable SSL for database connections in production environment'
          });
        } else if (!connectionInfo.ssl) {
          this.log('Warning: SSL is recommended but not required in development', {
            tip: 'Consider enabling SSL for better security'
          });
        }

        // Validate pool configuration if specified
        const poolConfig = this.config.database.poolConfig;
        if (poolConfig) {
          const currentConnections = await db.execute(sql`
            SELECT count(*) as conn_count 
            FROM pg_stat_activity 
            WHERE datname = current_database()
          `);

          this.log('Connection pool status', {
            currentConnections: currentConnections[0]?.conn_count,
            maxConnections: poolConfig.maxConnections
          });
        }

        return {
          success: true,
          message: 'Database validation passed',
          details: {
            ...connectionInfo,
            environment: this.config.name,
            nodeEnv: process.env.NODE_ENV,
            platform: isReplit ? 'Replit' : 'Local/Windsurf'
          }
        };
      } catch (dbError) {
        throw new DatabaseConnectionError(
          'Failed to connect to database',
          {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            config: {
              requireSSL: this.config.database.requireSSL,
              poolConfig: this.config.database.poolConfig
            },
            tips: [
              'Check if the database server is running',
              'Verify database credentials in DATABASE_URL',
              'Ensure network connectivity to database host',
              'Check if database port is accessible'
            ]
          }
        );
      }
    } catch (error) {
      // Rethrow DatabaseConnectionError as is
      if (error instanceof DatabaseConnectionError) {
        throw error;
      }

      // Convert other errors to DatabaseConnectionError
      throw new DatabaseConnectionError(
        error instanceof Error ? error.message : 'Unknown database validation error',
        {
          error: error instanceof Error ? error.stack : String(error),
          environment: this.config.name,
          nodeEnv: process.env.NODE_ENV
        }
      );
    }
  }
}