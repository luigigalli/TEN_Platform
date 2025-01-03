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

// Database configuration schema
export const databaseConfigSchema = z.object({
  url: z.string().url("Invalid database URL"),
  ssl: z.boolean().default(false),
  max_connections: z.number().int().positive().default(10),
  idle_timeout: z.number().int().positive().default(60),
});

// CORS configuration schema
export const corsConfigSchema = z.object({
  origins: z.array(z.union([z.string().url(), z.instanceof(RegExp)])),
  credentials: z.boolean().default(true),
  methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
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
}).strict();

export type Config = z.infer<typeof configSchema>;
export type PortConfig = z.infer<typeof portConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type CorsConfig = z.infer<typeof corsConfigSchema>;

// Validation helper functions
export function validatePort(port: number): boolean {
  try {
    portConfigSchema.parse({ port });
    return true;
  } catch {
    return false;
  }
}

export function validateDatabaseConfig(config: Partial<DatabaseConfig>): boolean {
  try {
    databaseConfigSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

export function validateEnvironment(env: string): env is Environment {
  return Object.values(Environment).includes(env as Environment);
}