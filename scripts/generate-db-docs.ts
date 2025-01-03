import { db } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

async function generateDatabaseDocs() {
  console.log('Generating database documentation...');

  try {
    // Get all tables
    const tables = await db.execute(sql`
      SELECT 
        table_name,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `);

    let markdown = '# Database Schema Documentation\n\n';
    markdown += 'This documentation is automatically generated from the database schema.\n\n';
    markdown += `Last updated: ${new Date().toISOString()}\n\n`;

    // For each table, get its columns
    for (const table of tables) {
      const columns = await db.execute(sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${table.table_name}
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      markdown += `## Table: ${table.table_name}\n\n`;
      markdown += '| Column | Type | Nullable | Default |\n';
      markdown += '|--------|------|----------|----------|\n';

      for (const column of columns) {
        markdown += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || 'NULL'} |\n`;
      }

      markdown += '\n';
    }

    // Write to docs/database-schema.md
    const docsPath = path.join(process.cwd(), 'docs', 'database-schema.md');
    await fs.writeFile(docsPath, markdown);

    console.log('Database documentation generated successfully!');
  } catch (error) {
    console.error('Error generating database documentation:', error);
    process.exit(1);
  }
}

generateDatabaseDocs();
