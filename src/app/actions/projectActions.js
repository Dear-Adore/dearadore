'use server';

import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ensureUserRow, getSessionUser, requireRole } from '../../lib/auth';

export async function saveDraft(themeId, themeName, formData) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await ensureUserRow(user);

    const q = query(collection(db, 'drafts'), where('userId', '==', user.id), where('themeId', '==', themeId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { formData, updatedAt: new Date().toISOString() });
    } else {
      const draftId = crypto.randomUUID();
      await setDoc(doc(db, 'drafts', draftId), {
        id: draftId,
        userId: user.id,
        themeId,
        themeName,
        formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDraft(identifier) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const userSnap = await getDoc(doc(db, 'users', user.id));
    const role = userSnap.exists() ? userSnap.data().role : 'user';

    // Identifier could be draftId or themeId. Need to search.
    const q1 = query(collection(db, 'drafts'), where('id', '==', identifier));
    const q2 = query(collection(db, 'drafts'), where('themeId', '==', identifier));
    
    let draftsToDelete = [];
    const snap1 = await getDocs(q1);
    const snap2 = await getDocs(q2);
    
    snap1.docs.forEach(d => draftsToDelete.push(d));
    snap2.docs.forEach(d => { if (!draftsToDelete.find(x => x.id === d.id)) draftsToDelete.push(d); });

    for (const d of draftsToDelete) {
      if (role === 'admin' || d.data().userId === user.id) {
        await deleteDoc(d.ref);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleFavorite(themeId) {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await ensureUserRow(user);

    const q = query(collection(db, 'favorites'), where('userId', '==', user.id), where('productId', '==', themeId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      await deleteDoc(snap.docs[0].ref);
      return { success: true, isFavorite: false };
    } else {
      const favId = crypto.randomUUID();
      await setDoc(doc(db, 'favorites', favId), {
        id: favId,
        userId: user.id,
        productId: themeId,
        createdAt: new Date().toISOString()
      });
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserFavorites() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, data: [] };

    const q = query(collection(db, 'favorites'), where('userId', '==', user.id));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(d => ({ id: d.id, ...d.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserDrafts() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, data: [] };

    const q = query(collection(db, 'drafts'), where('userId', '==', user.id));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(d => ({ id: d.id, ...d.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function validatePromoCode(code) {
  try {
    const q = query(collection(db, 'promocodes'), where('code', '==', code));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return { success: false, error: 'Kode promo tidak valid atau sudah kadaluarsa.' };
    }
    const promo = snap.docs[0].data();
    if ((promo.used || 0) >= (promo.quota || 9999)) {
      return { success: false, error: 'Kuota kode promo sudah habis.' };
    }
    return { success: true, discountPercent: promo.discountPercent };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { success: false, error: error.message };
  }
}
