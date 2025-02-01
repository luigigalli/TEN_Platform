import { Request, Response } from 'express';
import {
  formatError,
  handleKnownError,
  handleUnknownError,
  handle404,
  asyncHandler
} from '../../errors/handlers';
import { ValidationError } from '../../errors/types';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

describe('Error Handlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/test'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('formatError', () => {
    it('should format BaseError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const formatted = formatError(error);

      expect(formatted).toEqual({
        status: 'error',
        code: error.code,
        message: 'Invalid input',
        details: { field: 'email' }
      });
    });

    it('should format unknown error as InternalServerError', () => {
      const error = new Error('Test error');
      const result = formatError(error);

      expect(result).toEqual({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    });

    it('should use generic error message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      const result = formatError(error);

      expect(result).toEqual({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace when specified', () => {
      const error = new Error('Test error');
      const formatted = formatError(error, true);

      expect(formatted.stack).toBeDefined();
    });
  });

  describe('handleKnownError', () => {
    it('should handle BaseError with correct status and response', () => {
      const error = new ValidationError('Invalid input');
      
      handleKnownError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid input'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('handleUnknownError', () => {
    it('should handle unknown error as 500 Internal Server Error', () => {
      const error = new Error('Something went wrong');

      handleUnknownError(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Unexpected error', error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : 'Something went wrong'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('handle404', () => {
    it('should return 404 with correct error format', () => {
      handle404(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
        details: {
          method: 'GET',
          url: '/test'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('should handle resolved promises', async () => {
      const handler = asyncHandler(async (_req, res) => {
        res.json({ success: true });
      });

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rejected promises', async () => {
      const error = new Error('Async error');
      const handler = asyncHandler(async () => {
        throw error;
      });

      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
