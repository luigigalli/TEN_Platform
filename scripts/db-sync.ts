import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

// Get source and target database URLs based on environment
function getDatabaseUrls() {
  const replitUrl = process.env.REPLIT_DB_URL;
  const windsurfUrl = process.env.WINDSURF_DB_URL;
  const localUrl = process.env.DATABASE_URL;

  // Check if we're syncing from Replit to Windsurf
  const fromReplit = process.argv.includes('--from-replit');
  
  if (fromReplit) {
    if (!replitUrl || !windsurfUrl) {
      console.error('Error: Both REPLIT_DB_URL and WINDSURF_DB_URL must be set for Replit to Windsurf sync');
      process.exit(1);
    }
    return { source: replitUrl, target: windsurfUrl, mode: 'replit-to-windsurf' };
  } else {
    // Default to Windsurf to Replit sync
    if (!replitUrl || !windsurfUrl) {
      console.error('Error: Both REPLIT_DB_URL and WINDSURF_DB_URL must be set for Windsurf to Replit sync');
      process.exit(1);
    }
    return { source: windsurfUrl, target: replitUrl, mode: 'windsurf-to-replit' };
  }
}

function createDbClient(url: string, name: string) {
  console.log(`Connecting to ${name} database:`, url.replace(/:[^:]*@/, ':***@')); // Hide password
  return postgres(url, {
    max: 1,
    idle_timeout: 120,
    connect_timeout: 120,
    ssl: {
      rejectUnauthorized: false // Required for both Replit and Windsurf PostgreSQL
    },
    connection: {
      statement_timeout: 120000,
      query_timeout: 120000
    }
  });
}

async function testConnection(db: any, name: string) {
  console.log(`\nTesting ${name} database connection...`);
  const testResult = await db.execute(sql`
    SELECT 
      version(), 
      current_database(), 
      current_user, 
      inet_server_addr() AS server_ip,
      current_setting('ssl') as ssl_enabled
  `);

  console.log(`\n${name} Database Connection Info:`);
  console.log('- PostgreSQL Version:', testResult[0].version);
  console.log('- Database:', testResult[0].current_database);
  console.log('- User:', testResult[0].current_user);
  console.log('- Server IP:', testResult[0].server_ip);
  console.log('- SSL Enabled:', testResult[0].ssl_enabled);
}

async function syncData(sourceDb: any, targetDb: any) {
  // Get all tables from schema
  const tables = Object.values(schema)
    .filter(table => table.name !== undefined)
    .map(table => table.name);

  console.log('\nSyncing tables:', tables);

  for (const tableName of tables) {
    console.log(`\nSyncing table: ${tableName}`);
    
    // Get source data
    const sourceData = await sourceDb.execute(sql`SELECT * FROM ${sql.identifier(tableName)}`);
    console.log(`- Found ${sourceData.length} records in source`);

    if (sourceData.length > 0) {
      // Clear target table
      await targetDb.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
      console.log('- Cleared target table');

      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);
        
        // Generate insert query
        const values = batch.map(row => 
          `(${columns.map(col => {
            const val = row[col];
            return val === null ? 'NULL' : typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
          }).join(', ')})`
        ).join(',\n');

        const query = sql`
          INSERT INTO ${sql.identifier(tableName)} (${sql.join(columns.map(col => sql.identifier(col)), sql`, `)})
          VALUES ${sql.raw(values)}
        `;

        await targetDb.execute(query);
        console.log(`- Inserted batch of ${batch.length} records`);
      }
    }
  }
}

async function sync() {
  console.log('Starting database sync...');
  const { source, target, mode } = getDatabaseUrls();

  const sourceClient = createDbClient(source, 'source');
  const targetClient = createDbClient(target, 'target');

  const sourceDb = drizzle(sourceClient, { schema });
  const targetDb = drizzle(targetClient, { schema });

  try {
    // Test both connections
    await testConnection(sourceDb, 'Source');
    await testConnection(targetDb, 'Target');

    // Sync data
    await syncData(sourceDb, targetDb);

    console.log(`\nSync completed successfully! (${mode})`);
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

      if ((error as any).code === 'CONNECT_TIMEOUT') {
        console.error('\nConnection timeout - possible causes:');
        console.error('1. Database server is not reachable');
        console.error('2. Firewall blocking connection');
        console.error('3. Incorrect database URL or credentials');
        console.error('\nPlease verify:');
        console.error('- Database URLs are correctly set');
        console.error('- PostgreSQL services are running');
        console.error('- Network/firewall allows connections');
      }
    }
    process.exit(1);
  } finally {
    await Promise.all([sourceClient.end(), targetClient.end()]);
    process.exit(0);
  }
}

sync();