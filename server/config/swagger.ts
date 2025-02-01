import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import { env, isReplit } from './environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TEN API Documentation',
      version,
      description: 'API documentation for The Experiences Network (TEN)',
      contact: {
        name: 'API Support',
        url: 'https://docs.ten.network/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: isReplit ? env.REPL_URL || 'https://your-production-url.com' : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            status: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
          },
          required: ['id', 'username'],
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'User',
        description: 'User management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: [
    './server/routes/**/*.ts',
    './server/routes.ts',
    './server/auth.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// Helper function to setup swagger paths
export function setupSwaggerPaths(app: any) {
  // Route to get OpenAPI specification
  app.get('/api-docs.json', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}