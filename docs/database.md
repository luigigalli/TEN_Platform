# Database Schema and Management

## Overview
TEN uses PostgreSQL with Drizzle ORM for database management, supporting cross-environment synchronization.

## Schema Structure

### Core Tables

#### Users
```typescript
users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});
```

## Database Management

### Migrations
- Managed through Drizzle ORM
- Automatically synchronized across environments
- Version controlled schema changes

### Cross-Environment Sync
The project includes tools for database synchronization:
- `scripts/db-sync.ts`: Core synchronization logic
- `scripts/sync-windsurf.sh`: Windsurf sync script
- `scripts/sync-replit.sh`: Replit sync script

### Connection Management
- Environment-aware connection configuration
- Automatic SSL handling
- Connection pool optimization

## Development Workflow

### Making Schema Changes
1. Modify schema in `db/schema.ts`
2. Run `npm run db:push` to update local database
3. Use sync scripts to propagate changes across environments

### Data Migration
- Use Drizzle migrations for schema changes
- Manual data migration scripts when needed
- Validation of data integrity

## Best Practices
1. Always use Drizzle ORM for schema changes
2. Test migrations in development first
3. Backup data before large schema changes
4. Maintain backward compatibility
