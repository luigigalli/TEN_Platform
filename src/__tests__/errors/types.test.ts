import {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  createErrorFromStatus
} from '../../errors/types';

describe('Error Types', () => {
  describe('BaseError', () => {
    it('should create error with default properties', () => {
      const error = new BaseError('Test error', 500, 'INTERNAL_SERVER_ERROR');
      
      expect(error.name).toBe('BaseError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.context).toBeUndefined();
    });

    it('should create error with custom properties', () => {
      const error = new BaseError('Test error', 400, 'CUSTOM_ERROR', { test: 'value' });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.context).toEqual({ test: 'value' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        value: 'invalid'
      });

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({
        field: 'email',
        value: 'invalid'
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.name).toBe('AuthenticationError');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should use default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error', () => {
      const error = new AuthorizationError('Insufficient permissions');

      expect(error.name).toBe('AuthorizationError');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should use default message', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('Permission denied');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should use default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.name).toBe('ConflictError');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Too many requests');

      expect(error.name).toBe('RateLimitError');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });

    it('should use default message', () => {
      const error = new RateLimitError();
      expect(error.message).toBe('Too many requests');
    });
  });

  describe('InternalServerError', () => {
    it('should create internal server error', () => {
      const error = new InternalServerError('System failure');

      expect(error.name).toBe('InternalServerError');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should use default message', () => {
      const error = new InternalServerError();
      expect(error.message).toBe('Internal server error');
    });
  });

  describe('createErrorFromStatus', () => {
    it('should create appropriate error for status code', () => {
      const context = { userId: '123' };
      const message = 'Custom message';

      expect(createErrorFromStatus(400, message, context)).toBeInstanceOf(ValidationError);
      expect(createErrorFromStatus(401, message, context)).toBeInstanceOf(AuthenticationError);
      expect(createErrorFromStatus(403, message, context)).toBeInstanceOf(AuthorizationError);
      expect(createErrorFromStatus(404, message, context)).toBeInstanceOf(NotFoundError);
      expect(createErrorFromStatus(409, message, context)).toBeInstanceOf(ConflictError);
      expect(createErrorFromStatus(429, message, context)).toBeInstanceOf(RateLimitError);
    });

    it('should create internal server error for unknown status', () => {
      const error = createErrorFromStatus(418);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.statusCode).toBe(500);
    });

    it('should include context in created error', () => {
      const context = { detail: 'test' };
      const error = createErrorFromStatus(400, 'Bad Request', context);
      expect(error.context).toEqual(context);
    });
  });
});
