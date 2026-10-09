'use server';
import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { requireRole, getSessionUser } from '../../lib/auth';

const isStaff = () => requireRole(['admin', 'agent', 'finance']).then(() => true, () => false);

// -- CATALOG (PRODUCTS) --
export async function getProducts() {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addProduct(name, category, price, previewImage, videoUrl, previewUrl, features, tags, colors) {
  try {
    await requireRole(['admin', 'agent']);
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'products', id), {
      id, name, category, price, status: 'Aktif', previewImage, videoUrl, previewUrl, features, tags, colors, createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProductStatus(id, status) {
  try {
    await requireRole(['admin', 'agent']);
    await updateDoc(doc(db, 'products', id), { status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id) {
  try {
    await requireRole(['admin', 'agent']);
    await deleteDoc(doc(db, 'products', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id, name, category, price, status, previewImage, videoUrl, previewUrl, features, tags, colors) {
  try {
    await requireRole(['admin', 'agent']);
    await updateDoc(doc(db, 'products', id), {
      name, category, price, status, previewImage, videoUrl, previewUrl, features, tags, colors
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// -- PRICING ENGINE (ADDONS & PROMOCODES) --
export async function getAddons() {
  try {
    const snap = await getDocs(collection(db, 'pricing_addons'));
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateAddonPrice(id, price) {
  try {
    await requireRole(['admin', 'finance']);
    await updateDoc(doc(db, 'pricing_addons', id), { price });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createAddon(name, price) {
  try {
    await requireRole(['admin', 'finance']);
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'pricing_addons', id), {
      id, name, price, createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addPromocode(code, discountPercent, quota) {
  try {
    await requireRole(['admin', 'finance']);
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'promocodes', id), {
      id, code, discountPercent, quota, used: 0, createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPromocodes() {
  try {
    await requireRole(['admin', 'finance']);
    const snap = await getDocs(collection(db, 'promocodes'));
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// -- REVIEWS --
export async function getReviews() {
  try {
    const user = await getSessionUser();
    
    let isStaffUser = false;
    if (user) {
      const userSnap = await getDoc(doc(db, 'users', user.id));
      if (userSnap.exists() && ['admin', 'agent', 'finance'].includes(userSnap.data().role)) {
        isStaffUser = true;
      }
    }

    let q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    if (!isStaffUser) {
      q = query(collection(db, 'reviews'), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateReviewStatus(id, status) {
  try {
    await requireRole(['admin', 'agent']);
    await updateDoc(doc(db, 'reviews', id), { status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// -- PAYOUTS & REVENUE --
export async function getPayouts() {
  try {
    await requireRole(['admin', 'finance']);
    const q = query(collection(db, 'payouts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createPayout(amount, destination) {
  try {
    await requireRole(['admin', 'finance']);
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'payouts', id), {
      id, amount, destination, status: 'Pending', processedAt: null, createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getExpenses() {
  try {
    await requireRole(['admin', 'finance']);
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createExpense(title, amount, category) {
  try {
    await requireRole(['admin', 'finance']);
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'expenses', id), {
      id, title, amount, category, status: 'Lunas', date: new Date().toISOString(), createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
