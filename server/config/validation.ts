import { z } from 'zod';

// Environment type definition
export const Environment = {
  Development: 'development',
  Production: 'production',
  Test: 'test'
} as const;

export type Environment = typeof Environment[keyof typeof Environment];

// Port configuration schema with enhanced validation
export const portConfigSchema = z.object({
  port: z.coerce
    .number()
    .int()
    .min(1024, "Port must be >= 1024 (non-privileged ports)")
    .max(65535, "Port must be <= 65535")
    .default(5000),
  host: z.string()
    .min(1, "Host cannot be empty")
    .default('0.0.0.0'),
});

// Database configuration schema with environment-specific validation
export const databaseConfigSchema = z.object({
  url: z.string()
    .url("Database URL must be a valid URL")
    .refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      "Database URL must be a PostgreSQL connection string"
    ),
  ssl: z.boolean()
    .default((env) => env === Environment.Production),
  max_connections: z.number()
    .int()
    .positive()
    .default((env) => env === Environment.Production ? 20 : 10)
    .refine(
      (val, ctx) => {
        if (ctx.path.includes('production') && val < 10) {
          return false;
        }
        return true;
      },
      "Production environment requires at least 10 connections"
    ),
  idle_timeout: z.number()
    .int()
    .positive()
    .default(60)
    .refine(
      (val, ctx) => {
        if (ctx.path.includes('production') && val < 30) {
          return false;
        }
        return true;
      },
      "Production idle timeout must be at least 30 seconds"
    ),
}).superRefine((data, ctx) => {
  // Additional environment-specific validation
  const isProd = process.env.NODE_ENV === Environment.Production;
  if (isProd && !data.ssl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "SSL must be enabled in production environment",
      path: ["ssl"]
    });
  }
});

// Enhanced CORS configuration schema with environment-specific validation
export const corsConfigSchema = z.object({
  origins: z.array(z.union([
    z.string().url("Origin must be a valid URL"),
    z.instanceof(RegExp)
  ])).refine(
    (origins) => {
      const isProd = process.env.NODE_ENV === Environment.Production;
      if (isProd) {
        // In production, ensure no wildcard origins
        return !origins.some(origin => 
          typeof origin === 'string' && origin === '*'
        );
      }
      return true;
    },
    "Wildcard origins are not allowed in production"
  ),
  credentials: z.boolean().default(true),
  methods: z.array(z.string())
    .default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    .refine(
      (methods) => methods.every(m => 
        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'].includes(m)
      ),
      "Invalid HTTP method specified"
    ),
});

// Main configuration schema with enhanced validation
export const configSchema = z.object({
  env: z.nativeEnum(Environment).default(Environment.Development),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
    corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
    ssl: z.boolean().default(false),
    timeouts: z.object({
      read: z.number().int().positive().default(60000),
      write: z.number().int().positive().default(60000),
    }).optional(),
  }),
  database: databaseConfigSchema,
  security: z.object({
    trustProxy: z.boolean().default(false),
    rateLimiting: z.boolean().default(true),
  }).optional(),
}).strict().superRefine((data, ctx) => {
  // Environment-specific configuration validation
  const isProd = data.env === Environment.Production;

  if (isProd) {
    // Production-specific validations
    if (!data.security?.rateLimiting) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rate limiting must be enabled in production",
        path: ["security", "rateLimiting"]
      });
    }

    if (data.server.corsOrigins.includes('*')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wildcard CORS origins are not allowed in production",
        path: ["server", "corsOrigins"]
      });
    }
  }
});

export type Config = z.infer<typeof configSchema>;
export type PortConfig = z.infer<typeof portConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type CorsConfig = z.infer<typeof corsConfigSchema>;

// Enhanced validation helper functions with detailed error messages
export function validatePort(port: number): { valid: boolean; message?: string } {
  try {
    portConfigSchema.parse({ port });
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        message: error.issues.map(issue => issue.message).join(', ')
      };
    }
    return { valid: false, message: 'Invalid port configuration' };
  }
}

export function validateDatabaseConfig(
  config: Partial<DatabaseConfig>
): { valid: boolean; message?: string } {
  try {
    databaseConfigSchema.parse(config);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        message: error.issues.map(issue => issue.message).join(', ')
      };
    }
    return { valid: false, message: 'Invalid database configuration' };
  }
}

export function validateEnvironment(env: string): env is Environment {
  return Object.values(Environment).includes(env as Environment);
}

// Helper function to format validation error messages
export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map(issue => {
      const path = issue.path.join('.');
      return `${path ? `${path}: ` : ''}${issue.message}`;
    })
    .join('\n');
}