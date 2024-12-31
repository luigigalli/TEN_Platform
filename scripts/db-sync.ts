import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Database URLs
const LOCAL_DB_URL = process.env.DATABASE_URL;
const REPLIT_DB_URL = process.env.REPLIT_DB_URL;

// Validate required connections based on direction
const direction = process.argv[2] as 'pull' | 'push';
if (!direction || !['pull', 'push'].includes(direction)) {
  console.error('Usage: npm run db:sync [pull|push]');
  process.exit(1);
}

if (!REPLIT_DB_URL) {
  console.error('Error: REPLIT_DB_URL must be set');
  process.exit(1);
}

if (!LOCAL_DB_URL) {
  console.error('Error: DATABASE_URL must be set');
  process.exit(1);
}

// Base connection options
const baseOptions = {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
};

// Create database clients with environment-specific options
const localClient = postgres(LOCAL_DB_URL, {
  ...baseOptions,
  ssl: { rejectUnauthorized: false }
});

const replitClient = postgres(REPLIT_DB_URL, {
  ...baseOptions,
  ssl: { rejectUnauthorized: false }
});

// Create Drizzle instances
const localDb = drizzle(localClient, { schema });
const replitDb = drizzle(replitClient, { schema });

// Tables and their columns to sync
const TABLE_COLUMNS = {
  users: ['id', 'username', 'password', 'email', 'role', 'first_name', 'last_name', 'bio', 'avatar', 'languages', 'created_at', 'profile_completed'],
  services: ['id', 'title', 'description', 'price', 'location', 'provider_id', 'category', 'images', 'availability', 'created_at'],
  bookings: ['id', 'user_id', 'service_id', 'start_date', 'end_date', 'status', 'total_price', 'notes', 'created_at'],
  trips: ['id', 'title', 'description', 'user_id', 'destination', 'start_date', 'end_date', 'is_private', 'collaboration_settings', 'itinerary', 'created_at', 'updated_at'],
  messages: ['id', 'sender_id', 'receiver_id', 'conversation_id', 'message', 'status', 'message_type', 'context_id', 'context_type', 'created_at'],
  trip_members: ['id', 'trip_id', 'user_id', 'role', 'status', 'joined_at', 'last_activity'],
  trip_activities: ['id', 'trip_id', 'created_by', 'type', 'content', 'metadata', 'created_at']
};

function escapeValue(value: any): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
  return `'${value.toString().replace(/'/g, "''")}'`;
}

async function getTableData(db: any, table: string) {
  const columns = TABLE_COLUMNS[table as keyof typeof TABLE_COLUMNS];
  const result = await db.execute(sql.raw(`SELECT ${columns.join(', ')} FROM ${table} ORDER BY id`));
  return result;
}

async function syncTable(tableName: string, direction: 'pull' | 'push') {
  const source = direction === 'pull' ? replitDb : localDb;
  const target = direction === 'pull' ? localDb : replitDb;
  const columns = TABLE_COLUMNS[tableName as keyof typeof TABLE_COLUMNS];
  
  console.log(`Syncing ${tableName} (${direction})...`);
  
  try {
    // Get data from both databases
    const sourceData = await getTableData(source, tableName);
    const targetData = await getTableData(target, tableName);
    
    // Create maps for easy lookup
    const sourceMap = new Map(sourceData.map((row: any) => [row.id, row]));
    const targetMap = new Map(targetData.map((row: any) => [row.id, row]));
    
    // Find records to insert/update
    for (const [id, sourceRow] of sourceMap.entries()) {
      const targetRow = targetMap.get(id);
      
      if (!targetRow) {
        // Insert new record
        const values = columns.map(col => escapeValue(sourceRow[col]));
        
        await target.execute(sql.raw(`
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${values.join(', ')})
        `));
        console.log(`Inserted record ${id} into ${tableName}`);
      } else {
        // Update existing record if different
        const updates = columns
          .filter(col => sourceRow[col] !== targetRow[col])
          .map(col => `${col} = ${escapeValue(sourceRow[col])}`);
        
        if (updates.length > 0) {
          await target.execute(sql.raw(`
            UPDATE ${tableName}
            SET ${updates.join(', ')}
            WHERE id = ${id}
          `));
          console.log(`Updated record ${id} in ${tableName}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error syncing ${tableName}:`, error);
    throw error;
  }
}

async function sync(direction: 'pull' | 'push') {
  console.log(`Starting database sync (${direction})...`);
  
  try {
    // Test both database connections
    try {
      await localDb.execute(sql.raw('SELECT 1'));
      console.log('Successfully connected to local database');
    } catch (error) {
      console.error('Failed to connect to local database:', error);
      throw new Error('Local database connection failed');
    }

    try {
      await replitDb.execute(sql.raw('SELECT 1'));
      console.log('Successfully connected to Replit database');
    } catch (error) {
      console.error('Failed to connect to Replit database:', error);
      throw new Error('Replit database connection failed');
    }
    
    for (const table of Object.keys(TABLE_COLUMNS)) {
      await syncTable(table, direction);
    }
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await Promise.all([
      localClient.end(),
      replitClient.end()
    ]);
    process.exit(0);
  }
}

// Command line interface
sync(direction);
