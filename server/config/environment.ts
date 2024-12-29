import { z } from 'zod';
import { EnvironmentConfigError } from '../errors';

// Environment type definition
export const Environment = {
  Development: 'development',
  Production: 'production',
} as const;

export type Environment = typeof Environment[keyof typeof Environment];

// Environment detection utilities
export const isReplit = Boolean(process.env.REPL_ID && process.env.REPL_OWNER);
export const isDevelopment = process.env.NODE_ENV !== 'production';
export const currentEnvironment: Environment = isDevelopment ? Environment.Development : Environment.Production;

// Port configuration schema
export const portConfigSchema = z.object({
  port: z.coerce.number().int().min(1024).max(65535).default(5000),
  host: z.string().min(1).default('0.0.0.0'),
});

export type PortConfig = z.infer<typeof portConfigSchema>;

// Get environment-aware port configuration
export function getPortConfig(): PortConfig {
  try {
    // For consistency across environments, we'll always use port 5000
    // This simplifies development and deployment while avoiding conflicts
    const config = {
      port: 5000,
      host: '0.0.0.0'
    };

    return portConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EnvironmentConfigError('Invalid port configuration', { zodError: error.errors });
    }
    throw new EnvironmentConfigError('Failed to configure port');
  }
}