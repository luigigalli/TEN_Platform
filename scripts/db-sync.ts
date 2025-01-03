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

  // Fixed sync direction logic
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

async function syncTable(sourceDb: any, targetDb: any, tableName: string, attempt: number = 1): Promise<boolean> {
  const maxAttempts = 3;
  const retryDelay = 2000; // 2 seconds

  try {
    console.log(`- Fetching data from source table ${tableName}...`);
    const sourceData = await sourceDb.execute(sql`SELECT * FROM ${sql.identifier(tableName)}`);
    console.log(`- Found ${sourceData.length} records in source`);

    if (sourceData.length === 0) {
      console.log(`- No data to sync for ${tableName}`);
      return true;
    }

    console.log('- Sample record:', JSON.stringify(sourceData[0], null, 2));

    // Begin transaction for target operations
    await targetDb.execute(sql`BEGIN`);

    try {
      // Clear target table
      console.log('- Clearing target table...');
      await targetDb.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
      console.log('- Cleared target table');

      // Insert data in smaller batches for better error handling
      const batchSize = 25; // Reduced batch size for better handling
      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize);
        const columns = Object.keys(batch[0])
          .filter(col => col !== undefined && batch[0][col] !== undefined);

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
          ON CONFLICT (id) DO UPDATE SET ${sql.join(
            columns.map(col => sql.raw(`${col} = EXCLUDED.${col}`)),
            sql`, `
          )}
        `;

        await targetDb.execute(query);
        console.log(`- Inserted/Updated batch of ${batch.length} records`);
      }

      // Commit transaction
      await targetDb.execute(sql`COMMIT`);
      console.log(`- Successfully synced ${tableName}`);
      return true;
    } catch (error) {
      // Rollback on error
      await targetDb.execute(sql`ROLLBACK`);
      throw error;
    }
  } catch (error) {
    console.error(`\nError syncing table ${tableName} (attempt ${attempt}/${maxAttempts}):`, error);

    if (error instanceof Error && attempt < maxAttempts) {
      if (error.message.includes('foreign key constraint') || 
          error.message.includes('violates not-null constraint')) {
        console.log(`\nRetrying table ${tableName} in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return syncTable(sourceDb, targetDb, tableName, attempt + 1);
      }
    }

    return false;
  }
}

async function syncData(sourceDb: any, targetDb: any) {
  // Define table order based on dependencies
  // Updated order to respect foreign key constraints
  const tableOrder = [
    'users',            // No dependencies
    'trips',           // Depends on users
    'trip_members',    // Depends on users and trips
    'trip_activities', // Depends on users and trips
    'services',        // Depends on users
    'bookings',        // Depends on users and services
    'posts',          // Depends on users and trips
    'messages'        // Depends on users
  ];

  console.log('\nSyncing tables in order:', tableOrder);

  let failedTables: string[] = [];

  for (const tableName of tableOrder) {
    console.log(`\nSyncing table: ${tableName}`);
    const success = await syncTable(sourceDb, targetDb, tableName);
    if (!success) {
      console.error(`Failed to sync table: ${tableName}`);
      failedTables.push(tableName);
      // Break the sync if a parent table fails
      if (tableName === 'users' || tableName === 'trips') {
        console.error(`Critical table ${tableName} failed to sync. Stopping process.`);
        break;
      }
    }
  }

  if (failedTables.length > 0) {
    console.error('\nFailed to sync the following tables:', failedTables);
    return false;
  }

  return true;
}

async function sync() {
  console.log('\nStarting database sync...');
  const { source, target, mode } = getDatabaseUrls();

  const sourceClient = postgres(source, {
    max: 1,
    idle_timeout: 120,
    connect_timeout: 120,
    ssl: { rejectUnauthorized: false },
    connection: {
      statement_timeout: 120000,
      query_timeout: 120000
    }
  });

  const targetClient = postgres(target, {
    max: 1,
    idle_timeout: 120,
    connect_timeout: 120,
    ssl: { rejectUnauthorized: false },
    connection: {
      statement_timeout: 120000,
      query_timeout: 120000
    }
  });

  const sourceDb = drizzle(sourceClient, { schema });
  const targetDb = drizzle(targetClient, { schema });

  try {
    // Test both connections
    console.log('\nTesting database connections...');
    const [sourceInfo] = await sourceDb.execute(sql`
      SELECT version(), current_database(), current_user, 
             (SELECT COUNT(*) FROM users) as user_count,
             (SELECT COUNT(*) FROM trips) as trip_count
    `);
    console.log('\nSource database info:', sourceInfo);

    const [targetInfo] = await targetDb.execute(sql`
      SELECT version(), current_database(), current_user,
             (SELECT COUNT(*) FROM users) as user_count,
             (SELECT COUNT(*) FROM trips) as trip_count
    `);
    console.log('\nTarget database info:', targetInfo);

    // Sync data with improved error handling
    const success = await syncData(sourceDb, targetDb);

    if (success) {
      console.log(`\nSync completed successfully! (${mode})`);
    } else {
      console.error('\nSync completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\nDatabase sync failed:', error);
    process.exit(1);
  } finally {
    await Promise.all([sourceClient.end(), targetClient.end()]);
    process.exit(0);
  }
}

sync();