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
    const currentHost = process.env.HOST || '0.0.0.0';
    if (!this.config.server.allowedHosts.includes(currentHost)) {
      throw this.createError(
        `Invalid host configuration for ${this.config.name} environment`,
        {
          current: currentHost,
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

    // Deployment-specific validations
    if (process.env.NODE_ENV === 'production') {
      // Validate required deployment environment variables
      const deploymentVars = [
        'DATABASE_URL',
        isReplit ? 'REPL_ID' : 'WINDSURF_ENV'
      ];

      const missingVars = deploymentVars.filter(v => !process.env[v]);
      if (missingVars.length > 0) {
        throw this.createError(
          'Missing required deployment environment variables',
          {
            missing: missingVars,
            environment: this.config.name,
            nodeEnv: process.env.NODE_ENV,
            tip: 'Ensure all required environment variables are set for production deployment'
          }
        );
      }

      // SSL configuration validation for production
      if (!process.env.SSL_ENABLED && !isReplit) {
        this.log('Warning: SSL is not enabled in production environment', {
          tip: 'Consider enabling SSL for secure communication'
        });
      }

      // Validate external access configuration
      if (isReplit && !process.env.REPL_SLUG) {
        throw this.createError(
          'Missing Replit deployment configuration',
          {
            tip: 'REPL_SLUG is required for Replit deployments'
          }
        );
      }
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
          environment: this.config.name,
          nodeEnv: process.env.NODE_ENV,
          tips: [
            'Check if another process is using this port',
            'Try stopping other running services',
            'Use a different port if needed',
            'Ensure proper permissions for port binding'
          ]
        }
      );
    }

    this.log('Server validation passed');
    return {
      success: true,
      message: `Server validation passed for ${this.config.name}`,
      details: {
        environment: this.config.name,
        port,
        host: currentHost,
        ssl: process.env.NODE_ENV === 'production' && (process.env.SSL_ENABLED === 'true' || isReplit),
        deploymentReady: process.env.NODE_ENV === 'production'
      }
    };
  }

  /**
   * Check if a port is available for use
   */
  private async checkPortAvailability(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      let portCheckTimeout: NodeJS.Timeout;

      server.once('error', (err: NodeJS.ErrnoException) => {
        clearTimeout(portCheckTimeout);
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        clearTimeout(portCheckTimeout);
        server.close(() => resolve());
      });

      // Add timeout for port check
      portCheckTimeout = setTimeout(() => {
        server.close();
        reject(new Error(`Port check timed out after 5 seconds`));
      }, 5000);

      try {
        server.listen(port, '0.0.0.0');
      } catch (err) {
        clearTimeout(portCheckTimeout);
        reject(err);
      }
    });
  }
}