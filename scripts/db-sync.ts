import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL must be set');
  process.exit(1);
}

// Enhanced PostgreSQL connection with better timeout handling
const client = postgres(DB_URL, {
  max: 1,
  idle_timeout: 60, // Increased from 20 to 60
  connect_timeout: 60, // Increased from 30 to 60
  ssl: {
    rejectUnauthorized: false // Required for Replit's PostgreSQL
  },
  connection: {
    statement_timeout: 60000, // 1 minute timeout for statements
    query_timeout: 60000 // 1 minute timeout for queries
  }
});

const db = drizzle(client, { schema });

async function sync() {
  console.log('Starting database sync...');

  try {
    // Test connection
    console.log('Testing database connection...');
    await db.execute(sql.raw('SELECT 1'));
    console.log('Successfully connected to database');

    // Get database info
    const result = await db.execute(sql.raw('SELECT current_database(), current_user'));
    console.log('Connected to database:', result[0].current_database);
    console.log('Connected as user:', result[0].current_user);

    // Additional connection info for debugging
    console.log('Using database URL:', DB_URL.replace(/:[^:]*@/, ':***@')); // Hide password

    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Database sync failed:', error);
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

sync();