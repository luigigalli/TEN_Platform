import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

// Configure Chai
chai.use(sinonChai);
export const expect = chai.expect;
export const assert = chai.assert;

// Load environment variables
config();

// Create a separate test database connection
const testDbUrl = process.env.DATABASE_URL?.replace(
  /\/([^/]*)$/,
  '/test_$1'
) || '';

const sql = postgres(testDbUrl, { max: 1 });
export const db = drizzle(sql);

// Export commonly used testing utilities
export const sandbox = sinon.createSandbox();
