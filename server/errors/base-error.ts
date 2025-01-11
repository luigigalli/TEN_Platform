import { StatusCodes } from 'http-status-codes';

export interface ErrorMessage {
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export class ServerError extends Error {
  public statusCode: number;
  public details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorMessage {
    return {
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.BAD_REQUEST, details);
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.NOT_FOUND, details);
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.FORBIDDEN, details);
  }
}

export class DatabaseError extends ServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, details);
  }
}