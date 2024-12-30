import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { EnvironmentConfigError } from '../errors';
import { 
  ENVIRONMENT,
  getCurrentEnvironment,
  isDevelopment,
  isReplit,
  isWindsurf,
  serverConfigSchema,
  getAppropriateHost,
  getAppropriatePort 
} from './utils';

// Load environment variables in development
if (isDevelopment) {
  dotenv();
}

// Enhanced configuration schema with environment-specific validation
const configSchema = z.object({
  env: z.nativeEnum(ENVIRONMENT),
  server: serverConfigSchema.extend({
    corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)]))
  }),
  database: z.object({
    url: z.string().min(1)
  })
});

export type Config = z.infer<typeof configSchema>;

/**
 * Build configuration with enhanced environment awareness
 */
function buildConfig(): Config {
  try {
    // Build base configuration with environment-specific settings
    const config = {
      env: getCurrentEnvironment(),
      server: {
        port: getAppropriatePort(),
        host: getAppropriateHost(),
        corsOrigins: isDevelopment 
          ? ['*']
          : [
              // Allow Replit domains in production
              ...(isReplit ? [new RegExp(`^https?://${process.env.REPL_SLUG}\\.${process.env.REPL_OWNER}\\.repl\\.co$`)] : []),
              // Allow Windsurf domains
              ...(isWindsurf ? [new RegExp('^https?://.*\\.windsurf\\.dev$')] : []),
              // Always allow local development
              'http://localhost:5000',
              'http://127.0.0.1:5000',
              `http://${getAppropriateHost()}:${getAppropriatePort()}`
            ]
      },
      database: {
        url: process.env.DATABASE_URL || ''
      }
    };

    // Validate configuration
    const validated = configSchema.parse(config);

    // Enhanced logging in development
    if (isDevelopment) {
      console.log('[config] Environment:', validated.env);
      console.log('[config] Server:', {
        port: validated.server.port,
        host: validated.server.host,
        platform: isReplit ? 'Replit' : isWindsurf ? 'Windsurf' : 'Local'
      });
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError('Invalid configuration', { zodError: error.errors });
    }
    throw new EnvironmentConfigError('Failed to build configuration', { error });
  }
}

// Export validated configuration
export const config = buildConfig();

// Export environment utilities
export { ENVIRONMENT };
export type { Environment } from './utils';