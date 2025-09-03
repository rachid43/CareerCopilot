import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure postgres client
const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});
export const db = drizzle(sql, { schema });