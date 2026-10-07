import 'server-only';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from './supabase/server';

// User yang sedang login (dari cookie session Supabase), atau null.
export async function getSessionUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

// Pastikan baris public.users ada (fallback jika trigger DB belum jalan).
export async function ensureUserRow(authUser) {
  await db.insert(users).values({
    id: authUser.id,
    name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
    email: authUser.email,
    role: 'user',
  }).onConflictDoNothing({ target: users.id });
}

export async function requireRole(roles = ['admin']) {
  const authUser = await getSessionUser();
  if (!authUser) throw new Error('Unauthorized');
  let [row] = await db.select({ role: users.role, name: users.name }).from(users).where(eq(users.id, authUser.id));
  if (!row) {
    await ensureUserRow(authUser);
    [row] = await db.select({ role: users.role, name: users.name }).from(users).where(eq(users.id, authUser.id));
  }
  if (!row || !roles.includes(row.role)) throw new Error('Forbidden');
  
  authUser.dbRole = row.role;
  authUser.dbName = row.name;
  return authUser;
}

// Untuk mengambil user beserta role-nya tanpa throw error (cocok untuk Layout/Page)
export async function getUserWithRole() {
  const authUser = await getSessionUser();
  if (!authUser) return null;
  const [row] = await db.select({ role: users.role, name: users.name }).from(users).where(eq(users.id, authUser.id));
  if (row) {
    authUser.dbRole = row.role;
    authUser.dbName = row.name;
  }
  return authUser;
}
