/**
 * Custom error class for server-related errors
 */
export class ServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ServerError';
  }
}
