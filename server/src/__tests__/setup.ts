import { vi } from 'vitest';
import { env } from '../config/environment';

// Mock environment variables
vi.mock('../config/environment', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret',
    CLIENT_URL: 'http://localhost:5173',
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'test@test.com',
    SMTP_PASS: 'test-pass',
    SMTP_FROM: 'noreply@test.com',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

// Global test setup
beforeAll(() => {
  // Add any global test setup here
});

// Global test teardown
afterAll(() => {
  // Add any global test teardown here
});
