/**
 * Database validator module
 * @module validators/database
 */

import { BaseValidator, ValidationResult } from './base';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { DatabaseConnectionError } from '../../errors/environment';
import { isReplit, isWindsurf } from '../environment';

/**
 * Gets the appropriate database URL environment variable name for the current environment
 */
function getDatabaseUrlKey(): string {
  if (isReplit) return 'REPLIT_DB_URL';
  if (isWindsurf) return 'WINDSURF_DB_URL';
  return 'DATABASE_URL';
}

/**
 * Validates database configuration and connectivity
 */
export class DatabaseValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting database validation');

    try {
      // Get the appropriate database URL based on environment
      const dbUrlKey = getDatabaseUrlKey();
      const dbUrl = process.env[dbUrlKey];

      if (!dbUrl) {
        throw this.createError(`Missing ${dbUrlKey} environment variable`, {
          tip: `Ensure ${dbUrlKey} is set in your environment variables`,
          context: {
            environment: this.config.name,
            requiredVar: dbUrlKey
          }
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
          `Invalid ${dbUrlKey} format for ${this.config.name} environment`,
          {
            expected: validPrefixes,
            received: dbUrl.split(':')[0],
            tip: `${dbUrlKey} must start with a valid prefix (postgresql:// or postgres://)`
          }
        );
      }

      // Validate SSL requirements
      if (this.config.database.requireSSL && !dbUrl.includes('sslmode=')) {
        throw this.createError(
          `SSL is required for database connections in ${this.config.name} environment`,
          {
            tip: 'Add sslmode=require to your database URL',
            context: {
              environment: this.config.name,
              current: dbUrl
            }
          }
        );
      }

      // Test database connectivity with enhanced error handling
      try {
        // First try a basic connection test
        await db.execute(sql`SELECT 1`);

        // If successful, get more detailed information
        const [info] = await db.execute(sql`
          SELECT 
            version() as version,
            current_database() as database,
            current_user as user,
            inet_server_addr() as server_ip,
            current_setting('ssl') as ssl_enabled
        `);

        this.log('Database connection successful', {
          version: info.version,
          database: info.database,
          user: info.user,
          server: info.server_ip,
          ssl: info.ssl_enabled
        });

        return {
          success: true,
          details: {
            database: info.database,
            user: info.user,
            ssl: info.ssl_enabled === 'on'
          }
        };
      } catch (error) {
        throw new DatabaseConnectionError(
          'Failed to connect to database',
          {
            cause: error,
            context: {
              environment: this.config.name,
              error: error instanceof Error ? error.message : String(error)
            }
          }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseConnectionError) {
        throw error;
      }
      throw new DatabaseConnectionError(
        'Database validation failed',
        {
          cause: error,
          context: {
            environment: this.config.name,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      );
    }
  }
}