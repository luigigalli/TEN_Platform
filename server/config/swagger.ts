import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TEN API Documentation',
      version,
      description: 'API documentation for The Experiences Network',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? process.env.REPL_URL || 'https://your-production-url.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
