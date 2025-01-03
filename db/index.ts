import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";
import { DatabaseConfigError } from '../server/errors';
import { isReplit } from '../server/config/environment';

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new DatabaseConfigError(
    'Missing DATABASE_URL environment variable',
    { tip: 'Ensure DATABASE_URL is set in your environment variables' }
  );
}

// Configure connection options based on environment
const connectionOptions = {
  max: isReplit ? 10 : 5,
  idle_timeout: isReplit ? 60 : 30,
  connect_timeout: 20,
  // SSL configuration based on environment
  ssl: isReplit || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  connection: {
    // Extended timeouts for better stability
    statement_timeout: 60000,
    query_timeout: 60000,
  },
  debug: process.env.NODE_ENV === 'development',
  onnotice: () => {}, // Suppress notice messages
  onparameter: () => {}, // Suppress parameter messages
};

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

try {
  // Create database connection
  client = postgres(process.env.DATABASE_URL, connectionOptions);

  // Initialize Drizzle with schema
  db = drizzle(client, { schema });

  // Log successful connection in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Database] Connected successfully');
    console.log('[Database] Environment:', isReplit ? 'Replit' : 'Local/Windsurf');
    console.log('[Database] SSL:', connectionOptions.ssl ? 'Enabled' : 'Disabled');
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
  throw new DatabaseConfigError(
    'Failed to initialize database connection',
    { 
      error: errorMessage,
      environment: isReplit ? 'replit' : 'local',
      tips: [
        'Check DATABASE_URL format',
        'Verify database credentials',
        'Ensure database server is running',
        'Check network connectivity'
      ]
    }
  );
}

// Export the initialized database instance
export { db };