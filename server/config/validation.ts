import { z } from 'zod';

// Environment type definition
export const Environment = {
  Development: 'development',
  Production: 'production',
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

// Main configuration schema
export const configSchema = z.object({
  env: z.nativeEnum(Environment).default(Environment.Development),
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
    corsOrigins: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  }),
  database: z.object({
    url: z.string().min(1),
  }),
});

export type Config = z.infer<typeof configSchema>;
export type PortConfig = z.infer<typeof portConfigSchema>;