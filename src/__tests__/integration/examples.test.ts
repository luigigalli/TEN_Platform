import express from 'express';
import request from 'supertest';
import { setupErrorHandling } from '../../middleware/error';
import { ValidationError } from '../../errors/types';
import { asyncHandler } from '../../errors/handlers';
import { json } from 'express';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Error Handling Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(json());

    // Set up test routes
    app.get('/success', (_req, res) => {
      res.json({ message: 'Success' });
    });

    app.get('/validation-error', (_req, _res, next) => {
      next(new ValidationError('Invalid request', { field: 'email' }));
    });

    app.get('/unknown-error', (_req, _res, next) => {
      next(new Error('Something went wrong'));
    });

    app.get('/async-error', asyncHandler(async () => {
      throw new Error('Async error');
    }));

    // Set up error handling last
    setupErrorHandling(app as any);
  });

  it('should handle successful requests', async () => {
    const response = await request(app).get('/success');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
  });

  it('should handle validation errors', async () => {
    const response = await request(app).get('/validation-error');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: { field: 'email' }
    });
  });

  it('should handle unknown errors', async () => {
    const response = await request(app).get('/unknown-error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : 'Something went wrong'
    });
  });

  it('should handle async errors', async () => {
    const response = await request(app).get('/async-error');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : 'Async error'
    });
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/not-found');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found',
      details: {
        method: 'GET',
        url: '/not-found'
      }
    });
  });
});
