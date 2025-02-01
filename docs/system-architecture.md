# System Architecture Documentation

## Overview

The Experiences Network (TEN) is a digital travel planning platform built with a modern full-stack architecture. The system implements comprehensive trip management functionality through a microservices-based approach.

### Key Features
- Member management
- Activity tracking
- Collaboration settings
- Cross-environment synchronization
- Environment-aware configuration

## Component Architecture

### Frontend Layer (React + TypeScript)
- **Client Application**: React.js with TypeScript
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn/UI with Tailwind CSS
- **Routing**: Wouter for lightweight routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Layer (Node.js + Express)
- **API Server**: Express.js with TypeScript
- **Authentication**: Passport.js with session management
- **API Documentation**: Swagger/OpenAPI
- **Security**: Environment-aware CORS and SSL configuration

### Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle with type-safe queries
- **Schema Management**: Automated migrations
- **Connection Pooling**: Environment-specific configurations

### Cross-Cutting Concerns
- **Authentication**: Session-based with secure cookie management
- **Validation**: Zod schema validation across all layers
- **Error Handling**: Standardized error responses
- **Logging**: Environment-aware logging levels

## Environment Configuration

### Development Environments

#### Local Development (Windsurf)
```
├── Database: Local PostgreSQL
├── SSL: Optional
├── Port: Dynamic allocation
└── Environment Variables: Local .env
```

#### Cloud Development (Replit)
```
├── Database: Managed PostgreSQL
├── SSL: Required in production
├── Port: Environment-configured
└── Environment Variables: Replit Secrets
```

### Environment Detection
The system automatically detects and configures for:
- Platform (Replit/Windsurf)
- Environment (Development/Production)
- Database connections
- Port configurations
- CORS settings

### Validation Checks
- Database connectivity and configuration
- Environment variables
- SSL requirements
- Port availability
- Cross-origin settings

## Cross-Platform Development Flow

### Development Process
1. **Local Development**
   - Local environment setup
   - Database synchronization
   - Code changes and testing

2. **Cloud Development**
   - Automatic environment detection
   - Database provisioning
   - Configuration adaptation

3. **Cross-Environment Sync**
   - Database schema synchronization
   - Environment variable management
   - Configuration validation

### Deployment Pipeline
1. **Build Process**
   - TypeScript compilation
   - Asset optimization
   - Environment validation

2. **Environment Setup**
   - Platform detection
   - Configuration loading
   - Database connection setup

3. **Runtime Configuration**
   - Port binding
   - SSL/TLS setup
   - Database pool management

### Security Considerations
- Environment-specific SSL requirements
- Secure session management
- Cross-origin resource sharing
- Database connection encryption

## Development Guidelines

### Environment Setup
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Start development server

### Best Practices
- Follow TypeScript strict mode
- Use environment validation checks
- Implement proper error handling
- Maintain cross-environment compatibility

### Common Issues
- Database connection errors
- Environment configuration mismatches
- Cross-origin request failures
- Port binding conflicts

## References
- [Workflow Documentation](./workflow.md)
- [API Documentation](/api-docs)
- [Database Schema](./database-schema.md)
