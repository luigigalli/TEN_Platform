export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation Error') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServerError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string = 'Internal Server Error', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
