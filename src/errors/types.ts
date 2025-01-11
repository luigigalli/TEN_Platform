/**
 * Custom error types for the TEN platform
 * Each error type extends Error and includes:
 * - statusCode: HTTP status code
 * - code: Internal error code for tracking
 * - context: Additional error context (optional)
 */

export interface ErrorContext {
  [key: string]: any;
}

export class BaseError extends Error {
  statusCode: number;
  code: string;
  context?: ErrorContext;

  constructor(message: string, statusCode: number, code: string, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 400, 'VALIDATION_ERROR', context);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication required', context?: ErrorContext) {
    super(message, 401, 'AUTHENTICATION_ERROR', context);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Permission denied', context?: ErrorContext) {
    super(message, 403, 'AUTHORIZATION_ERROR', context);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found', context?: ErrorContext) {
    super(message, 404, 'NOT_FOUND_ERROR', context);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 409, 'CONFLICT_ERROR', context);
  }
}

export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests', context?: ErrorContext) {
    super(message, 429, 'RATE_LIMIT_ERROR', context);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', context?: ErrorContext) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', context);
  }
}

// Error factory for creating errors from HTTP status codes
export const createErrorFromStatus = (
  statusCode: number,
  message?: string,
  context?: ErrorContext
): BaseError => {
  switch (statusCode) {
    case 400:
      return new ValidationError(message || 'Bad request', context);
    case 401:
      return new AuthenticationError(message, context);
    case 403:
      return new AuthorizationError(message, context);
    case 404:
      return new NotFoundError(message, context);
    case 409:
      return new ConflictError(message || 'Resource conflict', context);
    case 429:
      return new RateLimitError(message, context);
    default:
      return new InternalServerError(message, context);
  }
};
