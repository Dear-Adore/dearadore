'use server';

import { db } from '../../db';
import { orders, promocodes, products } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireRole } from '../../lib/auth';
import {
  SALES_PACKAGES,
  SALES_DISCOUNT_PERCENT,
  FALLBACK_COMMISSION,
  calcSalesPrice,
} from '../../lib/salesPackages';

const SALES_ROLES = ['sales', 'admin'];

// Satu kode promo per sales, deterministik dari user id (tanpa perubahan skema).
const codeFor = (userId) => `HERO-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;

async function ensurePromo(user) {
  const code = codeFor(user.id);
  await db.insert(promocodes).values({
    id: crypto.randomUUID(),
    code,
    discountPercent: SALES_DISCOUNT_PERCENT,
    quota: 999999,
    used: 0,
  }).onConflictDoNothing({ target: promocodes.code });
  const [promo] = await db.select().from(promocodes).where(eq(promocodes.code, code));
  return promo;
}

// Pesanan yang memakai kode promo sales (baik dibuat sales maupun checkout klien).
const ordersByCode = (code) =>
  db.select().from(orders)
    .where(sql`${orders.packageData}->'promoApplied'->>'code' = ${code}`)
    .orderBy(desc(orders.createdAt));

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
          monthOrders: list.filter(o => new Date(o.createdAt) >= monthStart).length,
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
    const data = await db.select({ id: products.id, name: products.name, category: products.category })
      .from(products).where(eq(products.status, 'Aktif')).orderBy(products.name);
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

    const [theme] = await db.select().from(products).where(eq(products.id, input.themeId));
    if (!theme) throw new Error('Tema tidak ditemukan');

    const promo = await ensurePromo(user);
    const { discount, total } = calcSalesPrice(pkg.price);
    const orderId = `ORD-DA-${Date.now().toString().slice(-6)}`;

    await db.insert(orders).values({
      id: orderId,
      userId: user.id,
      themeId: theme.id,
      themeName: theme.name,
      clientName: input.clientName.trim(),
      eventType: input.eventType?.trim() || theme.category || 'Lainnya',
      eventDate,
      paymentMethod: 'qris',
      paymentStatus: 'paid',
      status: 'proses',
      agentId: user.id,
      totalPrice: total,
      packageData: {
        id: orderId,
        source: 'sales',
        salesId: user.id,
        themeId: theme.id,
        themeTitle: theme.name,
        clientName: input.clientName.trim(),
        clientPhone: input.clientPhone?.trim() || null,
        package: { id: pkg.id, name: pkg.name, catalogPrice: pkg.price, discount, totalPrice: total },
        salesCommission: pkg.commission,
        promoApplied: { code: promo.code, discountPercent: promo.discountPercent },
        totalPrice: total,
      },
    });

    await db.update(promocodes).set({ used: sql`used + 1` }).where(eq(promocodes.code, promo.code));

    return {
      success: true,
      order: { id: orderId, clientName: input.clientName.trim(), packageName: pkg.name, catalogPrice: pkg.price, discount, total },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
