# API Documentation

## Overview
TEN's API provides endpoints for user management, trip coordination, and collaborative features.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://[your-domain]/api`

## Authentication
All authenticated endpoints require a valid session cookie.

### Endpoints

#### User Management
```typescript
POST /api/register
- Register new user
- Body: { username: string, password: string }
- Returns: { id: number, username: string }

POST /api/login
- Login user
- Body: { username: string, password: string }
- Returns: { id: number, username: string }

POST /api/logout
- Logout current user
- Returns: { message: string }

GET /api/user
- Get current user information
- Returns: User object or 401 if not authenticated
```

## Error Handling
All endpoints follow a consistent error response format:
```typescript
{
  message: string,
  code: string,
  statusCode: number,
  details?: Record<string, unknown>
}
```

## Response Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Development Guidelines
1. All routes should be prefixed with `/api`
2. Use proper HTTP methods
3. Validate input data
4. Include appropriate error handling
5. Document new endpoints here
