import { Express } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import path from 'path';

/**
 * Setup OpenAPI validation middleware
 */
export function setupOpenApiValidation(app: Express) {
  const apiSpec = path.join(process.cwd(), 'src/openapi/spec.yaml');

  app.use(
    OpenApiValidator.middleware({
      apiSpec,
      validateRequests: true,
      validateResponses: process.env.NODE_ENV !== 'production',
      validateSecurity: {
        handlers: {
          // Add security handlers here
          bearerAuth: async (req) => {
            // Implement token validation
            return true;
          }
        }
      },
      validateFormats: 'full',
      formats: {
        // Add custom formats here
        email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        'date-time': (dateTime: string) => !isNaN(Date.parse(dateTime))
      }
    })
  );

  // Error handler for OpenAPI validation errors
  app.use((err: any, _req: any, res: any, next: any) => {
    if (err.status === 400 && err.errors) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors
      });
    } else {
      next(err);
    }
  });
}
