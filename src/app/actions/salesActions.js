'use server';

import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { requireRole } from '../../lib/auth';
import {
  SALES_PACKAGES,
  SALES_DISCOUNT_PERCENT,
  FALLBACK_COMMISSION,
  calcSalesPrice,
} from '../../lib/salesPackages';

const SALES_ROLES = ['sales', 'admin'];

const codeFor = (userId) => `HERO-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;

async function ensurePromo(user) {
  const code = codeFor(user.id);
  const q = query(collection(db, 'promocodes'), where('code', '==', code));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  
  const id = crypto.randomUUID();
  const newPromo = {
    id,
    code,
    discountPercent: SALES_DISCOUNT_PERCENT,
    quota: 999999,
    used: 0,
    agentId: user.id,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'promocodes', id), newPromo);
  return newPromo;
}

const ordersByCode = async (code) => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  // Manual filter because Firestore json subfield queries are limited
  return JSON.parse(JSON.stringify(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    .filter(o => o.packageData?.promoApplied?.code === code);
};

const commissionOf = (o) => o.commissionAmount > 0 ? o.commissionAmount : (o.packageData?.salesCommission ?? FALLBACK_COMMISSION);

export async function getSalesDashboard() {
  try {
    const user = await requireRole(SALES_ROLES);
    const promo = await ensurePromo(user);
    const list = await ordersByCode(promo.code);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const paid = list.filter(o => o.paymentStatus === 'paid');
    return {
      success: true,
      data: {
        name: user.dbName,
        promo: { code: promo.code, discountPercent: promo.discountPercent, used: promo.used },
        stats: {
          totalOrders: list.length,
          monthOrders: list.filter(o => new Date(o.createdAt || 0) >= monthStart).length,
          paidOrders: paid.length,
          unpaidOrders: list.length - paid.length,
          totalCommission: list.reduce((s, o) => s + commissionOf(o), 0),
          paidCommission: paid.reduce((s, o) => s + commissionOf(o), 0),
        },
        orders: list.map(o => ({
          id: o.id,
          clientName: o.clientName,
          themeName: o.themeName,
          totalPrice: o.totalPrice,
          paymentStatus: o.paymentStatus,
          status: o.status,
          commission: commissionOf(o),
          source: o.packageData?.source === 'sales' ? 'Sales' : 'Klien',
          createdAt: o.createdAt,
        })),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSalesThemes() {
  try {
    await requireRole(SALES_ROLES);
    const q = query(collection(db, 'products'), where('status', '==', 'Aktif'));
    const snap = await getDocs(q);
    let data = snap.docs.map(d => ({ id: d.id, name: d.data().name, category: d.data().category }));
    data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createSalesOrder(input) {
  try {
    const user = await requireRole(SALES_ROLES);
    const pkg = SALES_PACKAGES.find(p => p.id === input.packageId);
    if (!pkg) throw new Error('Paket tidak valid');
    if (!input.clientName?.trim()) throw new Error('Nama klien wajib diisi');
    const eventDate = new Date(input.eventDate);
    if (isNaN(eventDate.getTime())) throw new Error('Tanggal acara tidak valid');

    const themeSnap = await getDoc(doc(db, 'products', input.themeId));
    if (!themeSnap.exists()) throw new Error('Tema tidak ditemukan');
    const theme = themeSnap.data();

    const promo = await ensurePromo(user);
    const { discount, total } = calcSalesPrice(pkg.price);
    const orderId = `ORD-DA-${Date.now().toString().slice(-6)}`;

    const orderData = {
      id: orderId,
      userId: user.id,
      themeId: input.themeId,
      themeName: theme.name,
      clientName: input.clientName.trim(),
      eventType: input.eventType?.trim() || theme.category || 'Lainnya',
      eventDate: eventDate.toISOString(),
      paymentMethod: 'qris',
      paymentStatus: 'paid',
      status: 'proses',
      agentId: user.id,
      totalPrice: total,
      packageData: {
        id: orderId,
        source: 'sales',
        salesId: user.id,
        themeId: input.themeId,
        themeTitle: theme.name,
        clientName: input.clientName.trim(),
        clientPhone: input.clientPhone?.trim() || null,
        package: { id: pkg.id, name: pkg.name, catalogPrice: pkg.price, discount, totalPrice: total },
        salesCommission: pkg.commission,
        promoApplied: { code: promo.code, discountPercent: promo.discountPercent },
        totalPrice: total,
      },
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'orders', orderId), orderData);

    const pQuery = query(collection(db, 'promocodes'), where('code', '==', promo.code));
    const pSnap = await getDocs(pQuery);
    if (!pSnap.empty) {
      await updateDoc(pSnap.docs[0].ref, { used: (pSnap.docs[0].data().used || 0) + 1 });
    }

    return {
      success: true,
      order: { id: orderId, clientName: input.clientName.trim(), packageName: pkg.name, catalogPrice: pkg.price, discount, total },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
