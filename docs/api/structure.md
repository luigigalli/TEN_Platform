# API Structure Documentation

## Version
- Current Version: 1.0.0
- Last Updated: 2025-01-10

## Overview
The TEN platform's API follows a modular structure with clear separation of concerns. Each major feature has its own router module, middleware, and types. The API is designed to be extensible and adaptable to new features and service types.

## Directory Structure
```
server/
├── routes/             # Route handlers
│   ├── index.ts       # Main router configuration
│   ├── health.ts      # Health check endpoints
│   ├── user.ts        # User management endpoints
│   ├── services.ts    # Service management endpoints
│   └── trips.ts       # Trip management endpoints
├── middleware/         # Custom middleware
│   └── auth.ts        # Authentication middleware
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types
└── utils/             # Utility functions
    └── date.ts        # Date handling utilities
```

## Route Modules

### 1. Health Routes (`/api/health`)
- Health check endpoints
- System status monitoring

### 2. User Routes (`/api/user`)
- User registration
- Authentication
- Profile management
- User settings

### 3. Service Routes (`/api/services`)
- Service management (experiences, insurance, etc.)
- Service types:
  - Experiences (tours, activities, workshops)
  - Insurance (travel, activity)
  - Accommodation
  - Transport
- Service creation and updates
- Service discovery and search
- Pricing and availability

### 4. Trip Routes (`/api/trips`)
- Trip creation and management
- Member collaboration
- Trip activities
- Trip settings

## Extensibility

### 1. Adding New Service Types
The API is designed to support new service types through:
- Enum-based service type classification
- Flexible metadata structure
- Type-specific validation rules
- Custom business logic per service type

### 2. Feature Extension Points
New features can be added through:
1. **New Route Modules**
   - Create new route files in `routes/`
   - Register in `routes/index.ts`
   - Add corresponding documentation

2. **Enhanced Data Models**
   - Extend database schemas
   - Add new relations
   - Update validation rules

3. **Additional Middleware**
   - Service-specific middleware
   - Custom validation
   - Specialized logging

### 3. Version Management
- API versioning support
- Backward compatibility
- Feature flags for gradual rollout

## Middleware

### Authentication Middleware
- Session validation
- Role-based access control
- Request authentication

### Logging Middleware
- Request logging
- Timestamp formatting
- User action tracking

## Types
Shared TypeScript types for:
- Request objects
- Response objects
- User authentication
- Data models
- Service types and metadata

## Best Practices

### 1. Route Organization
- Each feature has its own router module
- Clear separation of concerns
- Consistent naming conventions

### 2. Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages

### 3. Authentication
- Session-based authentication
- Role-based access control
- Secure session management

### 4. Documentation
- Swagger/OpenAPI documentation
- Clear endpoint descriptions
- Request/response examples

### 5. Logging
- Request/response logging
- Error logging
- User action tracking

## Future Enhancements
1. Additional route modules:
   - Payments
   - Messages
   - Search
   - Analytics
   - Reviews and Ratings
   - Provider Management

2. Enhanced middleware:
   - Rate limiting
   - Request validation
   - Response caching
   - Service-specific validation

3. Advanced features:
   - WebSocket support
   - File uploads
   - Real-time notifications
   - Service recommendations
   - Dynamic pricing
   - Availability management
