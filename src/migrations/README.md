# Database Migrations

This directory contains database migrations for the TEN Platform. Each migration is timestamped and represents a specific change to the database schema.

## Current Migrations

### CreateUserGroupCustomerTables (1705861812000)
Initial migration that sets up the core tables for authentication and permissions:

#### Tables Created
1. **users**
   - UUID primary key
   - Personal information fields
   - Authentication fields
   - Role and permissions
   - Foreign keys to groups and customers

2. **groups**
   - UUID primary key
   - Name and description
   - JSONB permissions
   - Timestamps and active status

3. **customers**
   - UUID primary key
   - Organization information
   - Contact details
   - JSONB address and settings
   - Timestamps and active status

## Running Migrations

1. **Run migrations**:
   ```bash
   npm run migration:run
   ```

2. **Revert last migration**:
   ```bash
   npm run migration:revert
   ```

3. **Create new migration**:
   ```bash
   npm run migration:create src/migrations/MigrationName
   ```

4. **Generate migration from changes**:
   ```bash
   npm run migration:generate src/migrations/MigrationName
   ```

## Important Notes
- Always backup your database before running migrations in production
- Migrations are run in chronological order based on their timestamp
- Each migration should be reversible using the `down` method
- Test migrations in development environment first
- Use proper JSONB syntax for default values (e.g., `"'{}'"`)
