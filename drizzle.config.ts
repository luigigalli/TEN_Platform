import { defineConfig } from "drizzle-kit";

if (!process.env.REPLIT_DB_URL) {
  throw new Error("REPLIT_DB_URL must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.REPLIT_DB_URL,
  },
});
