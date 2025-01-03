# Environment Setup and Configuration

## Overview
TEN supports development across multiple environments with automated configuration detection and setup.

## Supported Environments

### Windsurf Development Environment
- **Host:** localhost
- **Default Port:** 3000
- **Database:** Local PostgreSQL
- **Development Tools:** Full local development stack

### Replit Environment
- **Host:** 0.0.0.0
- **Default Port:** 3001
- **Database:** Replit PostgreSQL
- **Development Tools:** Cloud-based development

## Configuration System

### Environment Detection
The system automatically detects the current environment through environment variables:
- `REPL_ID`: Indicates Replit environment
- `WINDSURF_ENV`: Indicates Windsurf environment

### Port Configuration
- Automatically selects appropriate ports based on environment
- Handles SSL termination in production
- Manages CORS settings per environment

### Database Configuration
- Automatic database URL configuration
- Environment-specific connection pools
- Cross-environment synchronization support

## Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Development/Production mode
- `PORT`: (Optional) Override default port

## Cross-Environment Development
The project supports seamless development across environments:

1. **Database Synchronization**
   ```bash
   # Sync from Windsurf to Replit
   npm run sync:windsurf
   
   # Sync from Replit to Windsurf
   npm run sync:replit
   ```

2. **Environment Switching**
   - Automated environment detection
   - Configuration adjustment
   - Connection pool management

## Validation and Error Handling
- Environment configuration validation
- Connection timeout handling
- Error reporting and logging
