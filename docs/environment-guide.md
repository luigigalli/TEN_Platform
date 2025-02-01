# Environment Configuration Guide

This guide explains how to configure the application for different environments: Replit, Windsurf, and local development.

## Environment Detection

The application automatically detects the current environment based on environment variables:
- Replit: Detected by `REPL_ID`
- Windsurf: Detected by `WINDSURF_ENV`
- Local: Default when neither of the above is present

## Database Configuration

### Replit Environment
```json
{
  "databaseUrl": "REPLIT_DB_URL",
  "requireSSL": true,
  "poolConfig": {
    "maxConnections": 10,
    "idleTimeout": 20
  }
}
```

### Windsurf Environment
```json
{
  "databaseUrl": "WINDSURF_DB_URL",
  "requireSSL": true,
  "poolConfig": {
    "maxConnections": 10,
    "idleTimeout": 20
  }
}
```

### Local Environment
```json
{
  "databaseUrl": "DATABASE_URL",
  "requireSSL": false,
  "poolConfig": {
    "maxConnections": 5,
    "idleTimeout": 30
  }
}
```

## Required Environment Variables

### Replit
- `REPL_ID`: Replit instance identifier
- `REPL_SLUG`: Replit project slug
- `REPLIT_DB_URL`: PostgreSQL database URL (with SSL enabled)

### Windsurf
- `WINDSURF_ENV`: Set to any value to enable Windsurf mode
- `WINDSURF_DB_URL`: PostgreSQL database URL (with SSL enabled)

### Local Development
- `DATABASE_URL`: Local PostgreSQL database URL

## SSL Configuration

Both Replit and Windsurf environments require SSL for database connections. The URL should include `?sslmode=require`:

```
postgresql://username:password@host:port/database?sslmode=require
```

## CORS Configuration

Each environment has specific CORS settings:

### Replit
- Allows all origins (`*`) for development purposes

### Windsurf
- Allows only `.windsurf.dev` domains
- Pattern: `/^https?:\/\/.*\.windsurf\.dev$/`

### Local
- Allows all origins (`*`) for development convenience

## Port Configuration

- Replit: Default port 3001
- Windsurf: Default port 3000
- Local: Default port 3000

## Debug Mode

Debug mode is enabled by default in all environments with varying levels of detail:

```json
{
  "verbose": true,
  "additionalInfo": {
    "platform": "[Environment Name]",
    "documentation": "[Documentation URL]"
  }
}