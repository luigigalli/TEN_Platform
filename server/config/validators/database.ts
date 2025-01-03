/**
 * Database validator module
 * @module validators/database
 */

import { BaseValidator, ValidationResult } from './base';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { DatabaseConnectionError } from '../../errors/environment';

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
      const validPrefixes = ['postgresql://', 'postgres://'];
      const hasValidPrefix = validPrefixes.some(prefix => dbUrl.startsWith(prefix));

      if (!hasValidPrefix) {
        throw this.createError(
          `Invalid DATABASE_URL format for ${this.config.name} environment`,
          {
            expected: validPrefixes,
            received: dbUrl.split(':')[0],
            tip: 'DATABASE_URL must start with either postgresql:// or postgres://'
          }
        );
      }

      // Test database connectivity with enhanced error handling
      try {
        // First try a simple connection test
        await db.execute(sql`SELECT 1`);
        this.log('Basic connectivity test passed');

        // If basic test passes, get detailed connection info
        const result = await db.execute(sql`
          SELECT 
            current_database() as db_name,
            current_user as user_name,
            version() as version,
            inet_server_addr() AS server_ip,
            current_setting('server_version_num') AS version_num,
            current_setting('ssl') as ssl_enabled
        `);

        if (!result || !result[0]) {
          throw new Error('No response from database query');
        }

        const connectionInfo = {
          database: result[0].db_name,
          user: result[0].user_name,
          version: result[0].version?.split(' ')[0],
          serverIp: result[0].server_ip,
          versionNum: result[0].version_num,
          ssl: result[0].ssl_enabled === 'on'
        };

        this.log('Database connection successful', connectionInfo);

        // Additional SSL checks for production
        if (this.config.database.requireSSL && process.env.NODE_ENV === 'production' && !connectionInfo.ssl) {
          throw this.createError(
            'SSL is required for database connections in production',
            {
              current: 'SSL disabled',
              required: 'SSL enabled',
              tip: 'Enable SSL in database configuration'
            }
          );
        }

        return {
          success: true,
          message: 'Database validation passed',
          details: {
            ...connectionInfo,
            sslRequired: this.config.database.requireSSL
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