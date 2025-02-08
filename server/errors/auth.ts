import { StatusCodes } from 'http-status-codes';
import { ServerError } from './base-error';

export class AuthError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.UNAUTHORIZED, details);
  }
}
