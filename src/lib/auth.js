import 'server-only';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';

// User yang sedang login
export async function getSessionUser() {
  const cookieStore = cookies();
  const uid = cookieStore.get('firebase_uid')?.value;
  if (!uid) return null;
  return { id: uid };
}

// Pastikan baris users ada (fallback).
export async function ensureUserRow(authUser) {
  const userRef = doc(db, 'users', authUser.id);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: authUser.id,
      name: authUser.name || 'User',
      email: authUser.email || '',
      role: 'user',
      createdAt: new Date().toISOString()
    });
  }
}

export async function requireRole(roles = ['admin']) {
  const authUser = await getSessionUser();
  if (!authUser) throw new Error('Unauthorized');
  
  let userRef = doc(db, 'users', authUser.id);
  let userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await ensureUserRow(authUser);
    userSnap = await getDoc(userRef);
  }
  
  const userData = userSnap.data();
  if (!userData || !roles.includes(userData.role)) throw new Error('Forbidden');
  
  authUser.dbRole = userData.role;
  authUser.dbName = userData.name;
  return authUser;
}

export async function getUserWithRole() {
  const authUser = await getSessionUser();
  if (!authUser) return null;
  const userSnap = await getDoc(doc(db, 'users', authUser.id));
  if (userSnap.exists()) {
    const userData = userSnap.data();
    authUser.dbRole = userData.role;
    authUser.dbName = userData.name;
  }
  return authUser;
}
