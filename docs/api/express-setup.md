# Express.js Server Setup

## Version
- Current Version: 1.0.0
- Last Updated: 2025-01-10

## Overview
The TEN platform uses Express.js with TypeScript as its backend framework. This document outlines the server setup and configuration.

## Server Architecture

### Directory Structure
```
server/
├── config/         # Configuration files
├── middleware/     # Custom middleware
├── routes/         # API routes
├── errors/         # Error handling
└── utils/         # Utility functions
```

### Key Components

#### 1. Server Initialization (`server/index.ts`)
```typescript
import express from "express";
import { registerRoutes } from "./routes";
// ... other imports

// Server instance management for proper cleanup
interface ServerInstance {
  app: express.Application;
  server: Server;
}
```

#### 2. Middleware Setup
- Server initialization middleware
- Vite integration for development
- Static file handling
- Swagger documentation

#### 3. Error Handling
- Centralized error handling system
- Custom error classes
- Consistent error response format

#### 4. API Documentation
- Swagger integration
- Interactive API documentation at `/api-docs`

## Configuration

### Environment Variables
Required environment variables for server operation:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- Additional environment-specific variables

### Scripts
```bash
# Development
npm run dev:server    # Start server in development mode

# Production
npm run build        # Build the server
npm start           # Start in production mode
```

## Security Features
- CORS configuration
- Rate limiting
- Secure headers
- Session management

## Testing
- Unit tests for server components
- Integration tests for API endpoints
- Test coverage requirements

## Monitoring and Logging
- Request logging
- Error tracking
- Performance monitoring

## Best Practices
1. Use TypeScript for type safety
2. Implement proper error handling
3. Follow RESTful conventions
4. Document all endpoints
5. Maintain test coverage

## Related Documentation
- [API Documentation](../api.md)
- [System Architecture](../system-architecture.md)
- [Environment Guide](../environment-guide.md)
