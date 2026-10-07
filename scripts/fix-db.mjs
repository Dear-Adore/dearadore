import postgres from 'postgres';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);
const sql = postgres(env.DATABASE_URL, { prepare: false });

const dummy = ['amanda@example.com', 'budi@example.com', 'clara@example.com'];
const ids = (await sql`select id from public.users where email in ${sql(dummy)}`).map(r => r.id);
if (ids.length) {
  await sql`delete from public.favorites where user_id in ${sql(ids)}`;
  await sql`delete from public.drafts where user_id in ${sql(ids)}`;
  await sql`update public.orders set user_id = null where user_id in ${sql(ids)}`;
  await sql`delete from public.users where id in ${sql(ids)}`;
}
console.log('Dummy users deleted:', ids.length);

await sql.unsafe(readFileSync('supabase/sync_auth_users.sql', 'utf8'));
console.log('Trigger + backfill applied');

// Block public (anon key / PostgREST) access to every app table; app uses server-side DATABASE_URL.
for (const t of ['users', 'orders', 'drafts', 'favorites', 'products', 'pricing_addons', 'promocodes', 'reviews', 'payouts']) {
  await sql.unsafe(`alter table public.${t} enable row level security`);
}
console.log('RLS enabled on all public tables');

console.log(await sql`select id, name, email, role from public.users`);
await sql.end();
