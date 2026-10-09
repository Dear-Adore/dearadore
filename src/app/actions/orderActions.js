'use server';

import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { ensureUserRow, requireRole, getSessionUser } from '../../lib/auth';
import { calculateOrderPricing } from '../../lib/pricingEngine';

export async function createOrder(data) {
  try {
    const authUser = await getSessionUser();
    if (!authUser) return { success: false, error: 'Unauthorized' };
    await ensureUserRow(authUser);

    const userSnap = await getDoc(doc(db, 'users', authUser.id));
    const user = userSnap.exists() ? { id: authUser.id, ...userSnap.data() } : { id: authUser.id };

    let formattedPhone = data.contactPhone || user.phone || '';
    if (formattedPhone && !formattedPhone.startsWith('+62')) {
      if (formattedPhone.startsWith('0')) formattedPhone = '+62' + formattedPhone.slice(1);
      else formattedPhone = '+62' + formattedPhone;
    }

    // Sync phone & name if provided
    if (data.contactName || formattedPhone) {
      const updateData = {};
      if (data.contactName) { updateData.name = data.contactName; }
      if (formattedPhone) { updateData.phone = formattedPhone; }
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', user.id), updateData);
      }
    }

    const orderId = data.id || crypto.randomUUID();
    
    let parsedEventDate = new Date().toISOString();
    if (data.eventDate) {
      const d = new Date(data.eventDate);
      if (!isNaN(d.getTime())) parsedEventDate = d.toISOString();
    }

    let orderAgentId = null;
    let promoCodeStr = null;
    let hasPromo = false;
    if (data.promoApplied && data.promoApplied.code) {
      hasPromo = true;
      promoCodeStr = data.promoApplied.code;
      const promoQuery = query(collection(db, 'promocodes'), where('code', '==', data.promoApplied.code));
      const promoSnap = await getDocs(promoQuery);
      if (!promoSnap.empty) {
        const promoDoc = promoSnap.docs[0];
        orderAgentId = promoDoc.data().agentId;
        
        // Update quota usage
        await updateDoc(promoDoc.ref, { used: (promoDoc.data().used || 0) + 1 });
      }
    }

    let basePrice = 127000;
    if (data.themeId) {
      const pSnap = await getDoc(doc(db, 'products', data.themeId));
      if (pSnap.exists()) basePrice = pSnap.data().price || 127000;
    }
    const addonPrice = data.addonPrice || 0;
    const pricing = calculateOrderPricing(basePrice, addonPrice, hasPromo);

    const orderData = {
      id: orderId,
      userId: user.id,
      themeId: data.themeId || 'unknown',
      themeName: data.themeName || data.themeTitle || 'Dear Adore Theme',
      clientName: data.contactName || user.displayName || user.name || data.birthdayPersonName || data.eventName || 'Tanpa Nama',
      clientEmail: user.email || 'Tanpa Email',
      clientWa: formattedPhone || 'Tanpa WA',
      eventType: data.eventType || data.themeCategory || 'Lainnya',
      eventDate: parsedEventDate,
      paymentMethod: data.paymentMethod?.id || data.paymentMethod || 'manual',
      paymentStatus: data.paymentStatus || 'unpaid',
      agentId: orderAgentId,
      packageData: data,
      clientPhotos: data.clientPhotos || [],
      basePrice: pricing.basePrice,
      discountAmount: pricing.discountAmount,
      discountedBase: pricing.discountedBase,
      addonPrice: pricing.addonTotal,
      subtotal: pricing.subtotal,
      serviceFee: pricing.displayedServiceFee,
      totalPrice: pricing.grandTotal,
      commissionAmount: pricing.commissionAmount,
      promoCode: promoCodeStr,
      status: data.status || 'pending',
      isPriority: data.isPriority || false,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'orders', orderId), orderData, { merge: true });

    return { success: true, orderId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserOrders() {
  try {
    const user = await getSessionUser();
    if (!user) return { success: false, data: [] };
    const q = query(collection(db, 'orders'), where('userId', '==', user.id));
    const snap = await getDocs(q);
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort descending by createdAt in memory to avoid Firestore index requirement
    data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(data))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrders() {
  try {
    await requireRole(['admin', 'agent', 'finance']);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(snap.docs.map(d => ({ id: d.id, ...d.data() }))))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    await requireRole(['admin', 'agent', 'sales']);
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function confirmOrderPayment(orderId) {
  try {
    await requireRole(['admin', 'agent', 'sales']);
    await updateDoc(doc(db, 'orders', orderId), { 
      paymentStatus: 'paid',
      status: 'proses' 
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateOrderLinks(orderId, previewUrl, rsvpUrl, deadlineDays, packageData) {
  try {
    const authUser = await requireRole(['admin', 'agent']);
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) throw new Error('Not found');
    const orderData = snap.data();
    
    if (authUser.dbRole === 'agent' && orderData.agentId !== authUser.id) {
      throw new Error('Unauthorized');
    }

    const updatedPackageData = {
      ...packageData,
      previewUrl,
      rsvpUrl,
      deadlineDays
    };
    const newStatus = (previewUrl && rsvpUrl) ? 'selesai' : 'proses';
    
    await updateDoc(doc(db, 'orders', orderId), { 
      packageData: updatedPackageData,
      status: newStatus 
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrder(orderId) {
  try {
    const authUser = await requireRole(['admin', 'agent', 'sales', 'user']);
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return { success: true };
    const orderData = snap.data();

    if (authUser.dbRole === 'user' && orderData.userId !== authUser.id) throw new Error('Unauthorized');
    if ((authUser.dbRole === 'agent' || authUser.dbRole === 'sales') && orderData.agentId !== authUser.id && orderData.userId !== authUser.id) {
      throw new Error('Unauthorized');
    }
    
    await deleteDoc(doc(db, 'orders', orderId));
    
    // Also try deleting drafts with same ID
    const draftSnap = await getDoc(doc(db, 'drafts', orderId));
    if (draftSnap.exists()) {
       await deleteDoc(doc(db, 'drafts', orderId));
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
