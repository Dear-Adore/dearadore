import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db = null;

export const db = new Proxy({}, {
  get(target, prop) {
    if (!_db) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is missing at runtime. Please set it in Cloudflare Secrets.");
      }
      const client = globalThis.postgresClient || postgres(connectionString, { prepare: false });
      if (process.env.NODE_ENV !== 'production') {
        globalThis.postgresClient = client;
      }
      _db = drizzle(client, { schema });
    }
    return _db[prop];
  }
});
