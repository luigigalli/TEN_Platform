import { Request, Response, ErrorRequestHandler } from 'express';
import {
  createErrorHandlingMiddleware,
  notFoundMiddleware,
  setupErrorHandling
} from '../../middleware/error';
import { ValidationError } from '../../errors/types';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      query: {},
      body: {},
      params: {},
      headers: {},
      ip: '127.0.0.1'
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createErrorHandlingMiddleware', () => {
    it('should create middleware chain with logging enabled', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      expect(middleware).toHaveLength(4);
    });

    it('should skip error logging when logErrors is false', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: false });
      const error = new Error('Test error');
      const [errorLogger] = middleware as ErrorRequestHandler[];

      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log BaseError with correct context', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      const error = new ValidationError('Invalid input', { field: 'email' });

      const [errorLogger] = middleware as ErrorRequestHandler[];
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        error.message,
        error,
        expect.objectContaining({
          path: '/test',
          method: 'GET',
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          errorContext: { field: 'email' }
        })
      );
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should log unknown errors as unexpected', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      const error = new Error('Unknown error');

      const [errorLogger] = middleware as ErrorRequestHandler[];
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error occurred',
        error,
        expect.any(Object)
      );
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle known errors', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      const error = new ValidationError('Invalid input', { field: 'email' });

      const errorHandler = (middleware as ErrorRequestHandler[])[2];
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email' }
        })
      );
    });

    it('should skip error handling if headers are already sent', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      const error = new ValidationError('Invalid input', { field: 'email' });

      mockResponse.headersSent = true;
      const errorHandler = (middleware as ErrorRequestHandler[])[2];
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unknown errors', () => {
      const middleware = createErrorHandlingMiddleware({ logErrors: true });
      const error = new Error('Unknown error');

      const errorHandler = (middleware as ErrorRequestHandler[])[3];
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'INTERNAL_SERVER_ERROR'
        })
      );
    });
  });

  describe('notFoundMiddleware', () => {
    it('should log 404 errors and return correct response', () => {
      notFoundMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Route not found',
        expect.objectContaining({
          path: '/test',
          method: 'GET',
          ip: '127.0.0.1'
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          code: 'ROUTE_NOT_FOUND'
        })
      );
    });

    it('should skip 404 handling if headers are already sent', () => {
      mockResponse.headersSent = true;

      notFoundMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('setupErrorHandling', () => {
    it('should set up error handling on express app', () => {
      const mockApp = {
        use: jest.fn()
      };

      setupErrorHandling(mockApp as any);

      expect(logger.info).toHaveBeenCalledWith(
        'Setting up error handling middleware'
      );
      expect(mockApp.use).toHaveBeenCalledTimes(4);
      expect(logger.info).toHaveBeenCalledWith(
        'Error handling middleware setup complete'
      );
    });
  });
});
