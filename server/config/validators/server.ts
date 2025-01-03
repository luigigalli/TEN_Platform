/**
 * Server configuration validator module
 * @module validators/server
 */

import { BaseValidator, ValidationResult } from './base';
import { EnvironmentConfig } from '../environments/types';
import { PortBindingError } from '../../errors/environment';
import { isReplit } from '../environment';
import net from 'net';

/**
 * Validates server configuration and port availability
 */
export class ServerValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting server configuration validation');

    // Validate host configuration
    if (!this.config.server.allowedHosts.includes(process.env.HOST || '')) {
      throw this.createError(
        `Invalid host configuration for ${this.config.name} environment`,
        {
          current: process.env.HOST,
          allowed: this.config.server.allowedHosts,
          tip: `Host must be one of: ${this.config.server.allowedHosts.join(', ')}`
        }
      );
    }

    // Get port from environment or default
    const port = process.env.PORT 
      ? parseInt(process.env.PORT, 10)
      : this.config.server.defaultPort;

    // Validate port number
    if (isNaN(port) || port < 1024 || port > 65535) {
      throw this.createError(
        'Invalid port configuration',
        {
          port,
          valid_range: '1024-65535',
          tip: 'Port must be a number between 1024 and 65535'
        }
      );
    }

    // Check if port is available
    try {
      await this.checkPortAvailability(port);
    } catch (error) {
      throw new PortBindingError(
        `Port ${port} is not available`,
        {
          port,
          error: error instanceof Error ? error.message : String(error),
          tips: [
            'Check if another process is using this port',
            'Try stopping other running services',
            'Use a different port if needed'
          ]
        }
      );
    }

    // Environment-specific validations
    if (isReplit) {
      // Validate Replit-specific requirements
      if (!process.env.REPL_ID || !process.env.REPL_SLUG) {
        throw this.createError(
          'Missing required Replit environment variables',
          {
            missing: ['REPL_ID', 'REPL_SLUG'].filter(v => !process.env[v]),
            tip: 'These variables should be automatically set by Replit'
          }
        );
      }
    } else {
      // Local/Windsurf environment validations
      if (!process.env.WINDSURF_ENV && process.env.NODE_ENV === 'production') {
        this.log('Warning: Running in production mode without WINDSURF_ENV set');
      }
    }

    // Additional SSL checks for production
    if (process.env.NODE_ENV === 'production') {
      // Add SSL configuration validation if needed
      this.log('Production environment detected, SSL configuration is recommended');
    }

    this.log('Server validation passed');
    return {
      success: true,
      message: `Server validation passed for ${this.config.name}`,
      details: {
        environment: this.config.name,
        port,
        host: process.env.HOST || this.config.server.allowedHosts[0],
        ssl: process.env.NODE_ENV === 'production'
      }
    };
  }

  /**
   * Check if a port is available for use
   */
  private async checkPortAvailability(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close(() => resolve());
      });

      server.listen(port, '0.0.0.0');
    });
  }
}