mermaid\nerDiagram\n';

    // Process each table
    for (const table of tables) {
      // Get columns for current table
      const columns = await db.execute<ColumnInfo[]>(sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          col_description(
            (SELECT oid FROM pg_class WHERE relname = ${table.table_name}),
            ordinal_position
          ) as description
        FROM information_schema.columns
        WHERE table_name = ${table.table_name}
          AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      // Get foreign keys
      const foreignKeys = await db.execute<ForeignKeyInfo[]>(sql`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = ${table.table_name}
          AND tc.table_schema = 'public'
      `);

      // Add table to ER diagram
      markdown += `    ${table.table_name} {\n`;
      for (const column of columns) {
        markdown += `        ${column.data_type} ${column.column_name}\n`;
      }
      markdown += '    }\n\n';

      // Add relationships to ER diagram
      for (const fk of foreignKeys) {
        markdown += `    ${table.table_name} }|--|| ${fk.foreign_table_name} : references\n`;
      }
    }

    markdown += '