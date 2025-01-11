/// <reference types="jest" />

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Load environment variables
config();

// Set test timeout
jest.setTimeout(30000);

// Create a separate test database connection
const testDbUrl = process.env.DATABASE_URL?.replace(
  /\/([^/]*)$/,
  '/test_$1'
) || '';

const sql = postgres(testDbUrl, { max: 1 });
export const db = drizzle(sql);

// Global setup
beforeAll(async () => {
  // Any global setup (e.g., creating test data, setting up mocks)
});

// Global teardown
afterAll(async () => {
  // Clean up resources
  await sql.end();
});

// Reset database between tests
afterEach(async () => {
  // Clean up test data
});
