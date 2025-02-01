// Import the base error class
import { ServerError } from '../errors/base-error';

// Re-export ServerError for use in other modules
export { ServerError };

// Vite-specific error class
export class ViteServerError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VITE_SERVER_ERROR', 500, details);
    this.name = 'ViteServerError';
  }
}
