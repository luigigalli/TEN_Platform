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
 * @example
 * ```typescript
 * const config = detectEnvironment();
 * const validator = new DatabaseValidator(config);
 * await validator.validate();
 * ```
 */
export class DatabaseValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting database validation');

    // Verify DATABASE_URL exists and has correct format
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw this.createError('Missing DATABASE_URL environment variable');
    }

    if (!dbUrl.startsWith(this.config.database.urlPrefix)) {
      throw this.createError(
        `Invalid DATABASE_URL format for ${this.config.name} environment`,
        {
          expected: this.config.database.urlPrefix,
          received: dbUrl.split(':')[0],
          tip: `DATABASE_URL must start with ${this.config.database.urlPrefix}`
        }
      );
    }

    // Test database connectivity
    try {
      const result = await db.execute(sql`
        SELECT 
          current_database(),
          current_user,
          version(),
          inet_server_addr() AS server_ip,
          current_setting('server_version_num') AS version_num
      `);

      const connectionInfo = {
        database: result[0].current_database,
        user: result[0].current_user,
        version: result[0].version?.split(' ')[0],
        serverIp: result[0].server_ip,
        versionNum: result[0].version_num
      };

      this.log('Database connection successful', connectionInfo);

      return {
        success: true,
        message: 'Database validation passed',
        details: connectionInfo
      };
    } catch (error) {
      throw new DatabaseConnectionError(
        'Failed to connect to database',
        {
          error: error instanceof Error ? error.message : String(error),
          config: {
            urlPrefix: this.config.database.urlPrefix,
            requireSSL: this.config.database.requireSSL,
            poolConfig: this.config.database.poolConfig
          }
        }
      );
    }
  }
}
