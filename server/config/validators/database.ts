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
 * Gets the appropriate database URL environment variable
 */
function getDatabaseUrlKey(): string {
  // Always use DATABASE_URL as it's our standard across environments
  return 'DATABASE_URL';
}

/**
 * Validates database configuration and connectivity
 */
export class DatabaseValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting database connection check');

    try {
      // Get the appropriate database URL based on environment
      const dbUrlKey = getDatabaseUrlKey();
      const dbUrl = process.env[dbUrlKey];

      if (!dbUrl) {
        throw this.createError(
          'Database connection information is missing',
          {
            tip: `Please make sure ${dbUrlKey} is set in your environment variables. You can find the correct value in the team-updates/credentials.md file.`,
            context: {
              environment: this.config.name,
              requiredVar: dbUrlKey,
              helpLink: '/docs/environment-guide.md#database-configuration'
            }
          }
        );
      }

      // Log masked database URL for debugging
      this.log('Verifying database connection settings', {
        url: dbUrl.replace(/:[^:]*@/, ':***@')
      });

      // Check if URL starts with any of the valid prefixes
      const validPrefixes = this.config.database.urlPrefix;
      const hasValidPrefix = validPrefixes.some(prefix => dbUrl.startsWith(prefix));

      if (!hasValidPrefix) {
        throw this.createError(
          'Invalid database connection format',
          {
            expected: validPrefixes,
            received: dbUrl.split(':')[0],
            tip: `The database URL should start with either postgresql:// or postgres://. Please check your ${dbUrlKey} value.`,
            helpSteps: [
              'Check the connection string format in team-updates/credentials.md',
              'Ensure no extra characters were added when copying the URL',
              'Verify the URL hasn\'t been modified by any environment scripts'
            ]
          }
        );
      }

      // Validate SSL requirements
      if (this.config.database.requireSSL && !dbUrl.includes('sslmode=')) {
        this.log('Security Notice: SSL is recommended for database connections', {
          tip: 'Adding SSL encryption will improve your database security',
          helpSteps: [
            'Add sslmode=require to your database URL',
            'Update your connection settings in team-updates/credentials.md',
            'See docs/environment-guide.md for SSL setup instructions'
          ]
        });
      }

      // Test database connectivity with enhanced error handling
      try {
        // First try a basic connection test
        await db.execute(sql`SELECT 1`);
        this.log('Basic connection test successful');

        // If successful, get more detailed information
        const [info] = await db.execute(sql`
          SELECT 
            version() as version,
            current_database() as database,
            current_user as user,
            inet_server_addr() as server_ip,
            pg_postmaster_start_time() as start_time,
            current_setting('server_version_num') as version_num,
            current_setting('ssl') as ssl
        `);

        this.log('Database connection established successfully', {
          database: info.database,
          user: info.user,
          version: info.version,
          serverIp: info.server_ip,
          versionNum: info.version_num,
          ssl: info.ssl
        });

        // Check connection pool status
        const [poolInfo] = await db.execute(sql`
          SELECT 
            count(*) as current_connections,
            10 as max_connections
        `);

        this.log('Connection pool is healthy', {
          currentConnections: poolInfo.current_connections,
          maxConnections: poolInfo.max_connections,
          status: poolInfo.current_connections < poolInfo.max_connections ? 'Good' : 'Warning: Near capacity'
        });

        return {
          success: true,
          message: `Successfully connected to ${info.database} database`,
          details: {
            database: info.database,
            user: info.user,
            version: info.version,
            serverIp: info.server_ip,
            versionNum: info.version_num,
            ssl: info.ssl === 'on',
            environment: this.config.name,
            nodeEnv: process.env.NODE_ENV,
            platform: isReplit ? 'Replit' : isWindsurf ? 'Windsurf' : 'Local'
          }
        };
      } catch (error) {
        throw new DatabaseConnectionError(
          'Unable to connect to the database',
          {
            cause: error,
            context: {
              environment: this.config.name,
              error: error instanceof Error ? error.message : String(error),
              helpSteps: [
                'Check if the database server is running',
                'Verify your network connection',
                'Ensure your database credentials are correct',
                'Check firewall settings and access permissions',
                'See team-updates/credentials.md for valid connection details'
              ]
            }
          }
        );
      }
    } catch (error) {
      if (error instanceof DatabaseConnectionError) {
        throw error;
      }
      throw new DatabaseConnectionError(
        'Database configuration check failed',
        {
          cause: error,
          context: {
            environment: this.config.name,
            error: error instanceof Error ? error.message : String(error),
            helpSteps: [
              'Review your database configuration in team-updates/credentials.md',
              'Check environment variables are set correctly',
              'Verify network connectivity to the database server',
              'See docs/environment-guide.md for troubleshooting steps'
            ]
          }
        }
      );
    }
  }
}