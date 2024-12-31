import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Ensure we're using PostgreSQL URL
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!DB_URL.includes('postgres')) {
  console.error('Error: DATABASE_URL must be a PostgreSQL connection string');
  process.exit(1);
}

console.log('Using PostgreSQL database URL:', DB_URL.replace(/:[^:]*@/, ':***@')); // Hide password

// Configure PostgreSQL client with proper SSL settings and extended timeouts
const client = postgres(DB_URL, {
  max: 1,
  idle_timeout: 120, // Extended from 60 to 120
  connect_timeout: 120, // Extended from 60 to 120
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Replit's PostgreSQL
  } : false,
  connection: {
    statement_timeout: 120000, // Extended from 60000 to 120000
    query_timeout: 120000 // Extended from 60000 to 120000
  }
});

const db = drizzle(client, { schema });

async function sync() {
  console.log('Starting database sync...');

  try {
    // Test connection with detailed error reporting
    console.log('Testing database connection...');
    const testResult = await db.execute(sql`SELECT version(), current_database(), current_user, inet_server_addr() AS server_ip`);

    console.log('\nDatabase Connection Info:');
    console.log('- PostgreSQL Version:', testResult[0].version);
    console.log('- Database:', testResult[0].current_database);
    console.log('- User:', testResult[0].current_user);
    console.log('- Server IP:', testResult[0].server_ip);

    console.log('\nSync completed successfully!');
  } catch (error) {
    console.error('\nDatabase sync failed:');
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        address: (error as any).address,
        port: (error as any).port
      });

      // Additional error information for connection issues
      if ((error as any).code === 'CONNECT_TIMEOUT') {
        console.error('\nConnection timeout - possible causes:');
        console.error('1. Database server is not reachable');
        console.error('2. Firewall blocking connection');
        console.error('3. Incorrect database URL or credentials');
        console.error('\nPlease verify:');
        console.error('- DATABASE_URL environment variable is correctly set');
        console.error('- PostgreSQL service is running');
        console.error('- Network/firewall allows connection to the database port');
      }
    }
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

sync();