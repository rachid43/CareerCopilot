import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// Use DATABASE_URL for direct database connection
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Please configure your database connection.",
  );
}

// Configure postgres client for Supabase
const sql = postgres(databaseUrl, { 
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 30
});
export const db = drizzle(sql, { schema });