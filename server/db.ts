import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// Use SUPABASE_URL if available, otherwise fall back to DATABASE_URL  
const databaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_URL or DATABASE_URL must be set. Please configure your database connection.",
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