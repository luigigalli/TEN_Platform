
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors';

if (!process.env.REPLIT_DB_URL) {
  throw new DatabaseConfigError('Missing REPLIT_DB_URL environment variable');
}

// Ensure we're using the PostgreSQL URL directly
const dbUrl = process.env.REPLIT_DB_URL;

const connectionOptions = {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: { rejectUnauthorized: false }
};

export const db = drizzle(
  postgres(poolerUrl, connectionOptions),
  { schema }
);
