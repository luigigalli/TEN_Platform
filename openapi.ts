import * as OpenApiValidator from 'express-openapi-validator';
import { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupOpenAPI(app: Express) {
  // Serve OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.sendFile(path.join(__dirname, '../openapi/spec.yaml'));
  });

  // Install the OpenAPI validator middleware
  app.use(
    OpenApiValidator.middleware({
      apiSpec: path.join(__dirname, '../openapi/spec.yaml'),
      validateRequests: true,
      validateResponses: true,
      ignoreUndocumented: true,
    })
  );

  // Error handler for validation errors
  app.use((err: any, _req: any, res: any, next: any) => {
    // Format errors
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors,
    });
  });
}
