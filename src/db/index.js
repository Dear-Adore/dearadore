import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let _db = null;

export const db = new Proxy({}, {
  get(target, prop) {
    if (!_db) {
      // Use bracket notation to prevent Next.js from statically replacing this with undefined at build time
      let connectionString = process.env['DATABASE_URL'];

      // Extract from Cloudflare Context if running in OpenNext
      try {
        const ctx = getCloudflareContext();
        if (ctx && ctx.env && ctx.env.DATABASE_URL) {
          connectionString = ctx.env.DATABASE_URL;
        }
      } catch (e) {
        // Ignore fallback
      }

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
