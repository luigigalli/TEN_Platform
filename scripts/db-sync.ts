import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

function getDatabaseUrls() {
  const replitUrl = process.env.DATABASE_URL;
  const windsurfUrl = process.env.WINDSURF_DB_URL;

  if (!replitUrl || !windsurfUrl) {
    console.error('\nError: Both DATABASE_URL and WINDSURF_DB_URL must be set for database sync');
    console.error('\nPlease verify:');
    console.error('1. Check team-updates/credentials.md for latest credentials');
    console.error('2. Ensure both database URLs are set correctly');
    process.exit(1);
  }

  // Fixed the sync direction logic
  const fromReplit = process.argv.includes('--from-replit');
  const fromWindsurf = process.argv.includes('--from-windsurf');

  if (!fromReplit && !fromWindsurf) {
    console.error('\nError: Must specify either --from-replit or --from-windsurf');
    process.exit(1);
  }

  if (fromReplit && fromWindsurf) {
    console.error('\nError: Cannot specify both --from-replit and --from-windsurf');
    process.exit(1);
  }

  if (fromReplit) {
    console.log(`\nSync direction: Replit → Windsurf`);
    return {
      source: replitUrl,
      target: windsurfUrl,
      mode: 'replit-to-windsurf'
    };
  } else {
    console.log(`\nSync direction: Windsurf → Replit`);
    return {
      source: windsurfUrl,
      target: replitUrl,
      mode: 'windsurf-to-replit'
    };
  }
}

function validateDatabaseUrl(url: string, name: string) {
  if (!url.startsWith('postgresql://')) {
    console.error(`\nError: Invalid ${name} URL format`);
    console.error('Database URL must start with postgresql://');
    console.error('Example format: postgresql://username:password@host:port/database');
    process.exit(1);
  }
}

function createDbClient(url: string, name: string) {
  validateDatabaseUrl(url, name);
  console.log(`Connecting to ${name} database:`, url.replace(/:[^:]*@/, ':***@'));
  return postgres(url, {
    max: 1,
    idle_timeout: 120,
    connect_timeout: 120,
    ssl: {
      rejectUnauthorized: false
    },
    connection: {
      statement_timeout: 120000,
      query_timeout: 120000
    }
  });
}

async function testConnection(db: any, name: string) {
  console.log(`\nTesting ${name} database connection...`);
  try {
    const testResult = await db.execute(sql`
      SELECT 
        version(), 
        current_database(), 
        current_user, 
        inet_server_addr() AS server_ip,
        current_setting('ssl') as ssl_enabled,
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM trips) as trip_count
    `);

    console.log(`\n${name} Database Connection Info:`);
    console.log('- PostgreSQL Version:', testResult[0].version);
    console.log('- Database:', testResult[0].current_database);
    console.log('- User:', testResult[0].current_user);
    console.log('- Server IP:', testResult[0].server_ip);
    console.log('- SSL Enabled:', testResult[0].ssl_enabled);
    console.log('- User Count:', testResult[0].user_count);
    console.log('- Trip Count:', testResult[0].trip_count);
    return true;
  } catch (error) {
    console.error(`\nError connecting to ${name} database:`, error);
    return false;
  }
}

async function syncData(sourceDb: any, targetDb: any) {
  // Define table order based on dependencies
  const tableOrder = [
    'users',        // No dependencies
    'trips',        // Depends on users
    'services',     // Depends on users
    'bookings',     // Depends on users and services
    'posts',        // Depends on users and trips
    'messages',     // Depends on users
    'trip_members', // Depends on users and trips
    'trip_activities' // Depends on users and trips
  ];

  console.log('\nSyncing tables in order:', tableOrder);

  for (const tableName of tableOrder) {
    console.log(`\nSyncing table: ${tableName}`);

    try {
      // Get source data with additional logging
      console.log(`- Fetching data from source table ${tableName}...`);
      const sourceData = await sourceDb.execute(sql`SELECT * FROM ${sql.identifier(tableName)}`);
      console.log(`- Found ${sourceData.length} records in source`);

      if (sourceData.length > 0) {
        // Show sample of data being synced (first record)
        console.log('- Sample record:', JSON.stringify(sourceData[0], null, 2));

        // Clear target table
        console.log('- Clearing target table...');
        await targetDb.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
        console.log('- Cleared target table');

        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < sourceData.length; i += batchSize) {
          const batch = sourceData.slice(i, i + batchSize);
          const columns = Object.keys(batch[0]).filter(col => col !== undefined && batch[0][col] !== undefined);

          // Generate insert query
          const values = batch.map(row => 
            `(${columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
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
    } catch (error) {
      console.error(`\nError syncing table ${tableName}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      // Continue with next table instead of exiting
      continue;
    }
  }
}

async function sync() {
  console.log('\nStarting database sync...');
  const { source, target, mode } = getDatabaseUrls();

  const sourceClient = createDbClient(source, 'source');
  const targetClient = createDbClient(target, 'target');

  const sourceDb = drizzle(sourceClient, { schema });
  const targetDb = drizzle(targetClient, { schema });

  try {
    // Test both connections
    const sourceOk = await testConnection(sourceDb, 'Source');
    const targetOk = await testConnection(targetDb, 'Target');

    if (!sourceOk || !targetOk) {
      console.error('\nDatabase connection test failed');
      process.exit(1);
    }

    // Sync data
    await syncData(sourceDb, targetDb);

    console.log(`\nSync completed successfully! (${mode})`);
  } catch (error) {
    console.error('\nDatabase sync failed:', error);
    process.exit(1);
  } finally {
    await Promise.all([sourceClient.end(), targetClient.end()]);
    process.exit(0);
  }
}

sync();