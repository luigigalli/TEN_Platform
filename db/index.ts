
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors';

if (!process.env.REPLIT_DB_URL) {
  throw new DatabaseConfigError('Missing REPLIT_DB_URL environment variable');
}

// Connect using pooler URL for better stability
const poolerUrl = process.env.REPLIT_DB_URL.replace('.us-east-2', '-pooler.us-east-2');

const connectionOptions = {
  max: 1, // Reduce max connections
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: { rejectUnauthorized: false }
};

export const db = drizzle(
  postgres(poolerUrl, connectionOptions),
  { schema }
);
