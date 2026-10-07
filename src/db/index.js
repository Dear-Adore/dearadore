import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

// Fix for "max clients reached" in Next.js development (hot-reload)
const client = globalThis.postgresClient || postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== 'production') {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });
