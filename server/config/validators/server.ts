/**
 * Server validator module
 * @module validators/server
 */

import { BaseValidator, ValidationResult } from './base';
import net from 'net';
import { PortBindingError } from '../../errors/environment';

/**
 * Validates server configuration and port availability
 * @example
 * ```typescript
 * const config = detectEnvironment();
 * const validator = new ServerValidator(config);
 * await validator.validate();
 * ```
 */
export class ServerValidator extends BaseValidator {
  async validate(): Promise<ValidationResult> {
    this.log('Starting server validation');

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : this.config.server.defaultPort;
    const host = process.env.HOST || this.config.server.allowedHosts[0];

    // Validate port number
    if (isNaN(port) || port < 1024 || port > 65535) {
      throw this.createError('Invalid port number', {
        port,
        allowed: 'Port must be between 1024 and 65535'
      });
    }

    // Validate host
    if (!this.config.server.allowedHosts.includes(host)) {
      throw this.createError('Invalid host configuration', {
        host,
        allowed: this.config.server.allowedHosts
      });
    }

    // Check port availability
    await this.checkPortAvailability(port, host);

    return {
      success: true,
      message: 'Server validation passed',
      details: {
        port,
        host,
        cors: this.config.server.cors
      }
    };
  }

  private checkPortAvailability(port: number, host: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new PortBindingError(
            `Port ${port} is already in use`,
            { port, host }
          ));
        } else {
          reject(new PortBindingError(
            `Error checking port ${port}: ${err.message}`,
            {
              port,
              host,
              errorCode: err.code
            }
          ));
        }
      });

      server.once('listening', () => {
        server.close(() => resolve());
      });

      server.listen(port, host);
    });
  }
}
