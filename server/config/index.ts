import { z } from 'zod';
import { EnvironmentConfigError } from '../errors';
import { 
  env,
  Environment,
  isReplit,
  isWindsurf,
  isDevelopment,
  getReplitDevDomain
} from './environment';

// Enhanced configuration schema with environment-specific validation
const configSchema = z.object({
  env: z.nativeEnum(Environment),
  server: z.object({
    port: z.number().int().min(1024).max(65535),
    externalPort: z.number().int().min(1024).max(65535),
    host: z.string().min(1),
    corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  }),
  database: z.object({
    url: z.string().min(1, "Database URL is required")
  })
}).strict();

export type Config = z.infer<typeof configSchema>;

/**
 * Build configuration with enhanced environment awareness and error handling
 */
function buildConfig(): Config {
  try {
    // Get Replit Dev URL for CORS if available
    const replitDevDomain = getReplitDevDomain();
    console.log('[config] Replit Dev URL:', replitDevDomain || 'Not available');

    // Build base configuration with environment-specific settings
    const config = {
      env: env.NODE_ENV,
      server: {
        port: 5000, // Always use port 5000 internally for Replit
        externalPort: isReplit ? 3000 : 5000, // Map to port 3000 externally on Replit
        host: '0.0.0.0',
        corsOrigins: isDevelopment 
          ? ['*']
          : [
              // Allow Replit domains in production
              ...(isReplit ? [
                // Allow the specific Replit Dev URL if available
                ...(replitDevDomain ? [replitDevDomain] : []),
                // Fallback to the standard Replit domain pattern
                new RegExp(`^https?://${env.REPL_SLUG}\\.${env.REPL_OWNER}\\.repl\\.co$`)
              ] : []),
              // Allow Windsurf domains
              ...(isWindsurf ? [new RegExp('^https?://.*\\.windsurf\\.dev$')] : []),
              // Always allow local development
              'http://localhost:5000',
              'http://localhost:3000',
              'http://127.0.0.1:5000',
              'http://127.0.0.1:3000'
            ]
      },
      database: {
        url: env.DATABASE_URL
      }
    };

    // Validate configuration
    const validated = configSchema.parse(config);

    // Enhanced logging in development
    if (isDevelopment) {
      console.log('[config] Environment:', validated.env);
      console.log('[config] Server:', {
        internalPort: validated.server.port,
        externalPort: validated.server.externalPort,
        host: validated.server.host,
        platform: isReplit ? 'Replit' : isWindsurf ? 'Windsurf' : 'Local',
        ...(replitDevDomain && { replitDevUrl: replitDevDomain })
      });
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError('Invalid configuration', {
        validationErrors: error.errors,
        tip: "Check if all required environment variables are set correctly."
      });
    }
    throw new EnvironmentConfigError('Failed to build configuration', {
      error: error instanceof Error ? error.message : String(error),
      tip: "This might be due to invalid environment variables or configuration schema mismatch."
    });
  }
}

// Export validated configuration
export const config = buildConfig();

// Export environment utilities
export { Environment, type Environment as EnvironmentType } from './environment';
export { isReplit, isWindsurf, isDevelopment } from './environment';