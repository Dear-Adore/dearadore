'use server';

import { db } from '../../db';
import { orders, promocodes, products, users, drafts } from '../../db/schema';
import { eq, desc, sql, and, or } from 'drizzle-orm';
import { createClient } from '../../lib/supabase/server';
import { ensureUserRow, requireRole } from '../../lib/auth';
import { calculateOrderPricing } from '../../lib/pricingEngine';

export async function createOrder(data) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await ensureUserRow(user);

    // Sync phone & name if provided
    if (data.contactName || data.contactPhone) {
      let phoneToSave = data.contactPhone;
      if (phoneToSave && !phoneToSave.startsWith('+62')) {
        if (phoneToSave.startsWith('0')) phoneToSave = '+62' + phoneToSave.slice(1);
        else phoneToSave = '+62' + phoneToSave;
      }
      const updateData = {};
      const meta = {};
      if (data.contactName) { updateData.name = data.contactName; meta.full_name = data.contactName; }
      if (phoneToSave) { updateData.phone = phoneToSave; meta.phone = phoneToSave; }
      await db.update(users).set(updateData).where(eq(users.id, user.id));
      if (Object.keys(meta).length > 0) {
        await supabase.auth.updateUser({ data: meta });
      }
    }

    const orderId = data.id || crypto.randomUUID(); // Pakai ID dari payload jika ada
    
    // Pastikan eventDate jadi object Date agar sesuai dengan kolom timestamp
    let parsedEventDate = new Date();
    if (data.eventDate) {
      const d = new Date(data.eventDate);
      if (!isNaN(d.getTime())) parsedEventDate = d;
    }

    let orderAgentId = null;
    let promoCodeStr = null;
    let hasPromo = false;
    if (data.promoApplied && data.promoApplied.code) {
      hasPromo = true;
      promoCodeStr = data.promoApplied.code;
      const promoInfo = await db.select().from(promocodes).where(eq(promocodes.code, data.promoApplied.code));
      if (promoInfo.length > 0) {
        orderAgentId = promoInfo[0].agentId;
      }
    }

    // --- PONYTAIL FIX: Ambil basePrice dari DB, JANGAN percaya client ---
    let basePrice = 127000;
    if (data.themeId) {
      const prod = await db.select({ price: products.price }).from(products).where(eq(products.id, data.themeId));
      if (prod.length > 0) basePrice = prod[0].price;
    }
    const addonPrice = data.addonPrice || 0; // TODO: Hitung addon dari DB jika perlu
    const pricing = calculateOrderPricing(basePrice, addonPrice, hasPromo);

    await db.insert(orders).values({
      id: orderId,
      userId: user.id,
      themeId: data.themeId || 'unknown',
      themeName: data.themeName || data.themeTitle || 'Dear Adore Theme',
      
      // -- Kolom Ekstraksi Baru --
      clientName: data.birthdayPersonName || data.eventName || 'Tanpa Nama',
      eventType: data.eventType || data.themeCategory || 'Lainnya',
      eventDate: parsedEventDate,
      paymentMethod: data.paymentMethod?.id || data.paymentMethod || 'manual',
      paymentStatus: data.paymentStatus || 'unpaid',
      agentId: orderAgentId,
      
      packageData: data,
      clientPhotos: data.clientPhotos || [],
      
      // -- KEUANGAN (Dihitung Server) --
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
    }).onConflictDoUpdate({
      target: orders.id,
      set: {
        themeId: data.themeId || 'unknown',
        themeName: data.themeName || data.themeTitle || 'Dear Adore Theme',
        clientName: data.birthdayPersonName || data.eventName || 'Tanpa Nama',
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
      }
    });

    if (data.promoApplied && data.promoApplied.code) {
      await db.update(promocodes)
        .set({ used: sql`used + 1` })
        .where(eq(promocodes.code, data.promoApplied.code));
    }

    return { success: true, orderId };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserOrders() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [] };
    const data = await db.select().from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getOrders() {
  try {
    await requireRole(['admin', 'agent', 'finance']);
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return { success: true, data: allOrders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    await requireRole(['admin', 'agent', 'sales']);
    await db.update(orders)
      .set({ status: newStatus })
      .where(eq(orders.id, orderId));
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
}

export async function confirmOrderPayment(orderId) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    await requireRole(['admin', 'agent', 'sales']);
    
    await db.update(orders)
      .set({ 
        paymentStatus: 'paid',
        status: 'proses' 
      })
      .where(eq(orders.id, orderId));
    return { success: true };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderLinks(orderId, previewUrl, rsvpUrl, deadlineDays, packageData) {
  try {
    const authUser = await requireRole(['admin', 'agent']);
    
    let whereClause = eq(orders.id, orderId);
    if (authUser.dbRole === 'agent') {
      // PONYTAIL FIX: Agent hanya bisa update order-nya sendiri
      whereClause = and(eq(orders.id, orderId), eq(orders.agentId, authUser.id));
    }

    const updatedPackageData = {
      ...packageData,
      previewUrl,
      rsvpUrl,
      deadlineDays
    };
    
    // Automatically set status to selesai if both links exist
    const newStatus = (previewUrl && rsvpUrl) ? 'selesai' : 'proses';
    
    await db.update(orders)
      .set({ 
        packageData: updatedPackageData,
        status: newStatus 
      })
      .where(whereClause);
    return { success: true };
  } catch (error) {
    console.error('Error updating order links:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteOrder(orderId) {
  try {
    const authUser = await requireRole(['admin', 'agent', 'sales', 'user']);
    let whereClause = eq(orders.id, orderId);

    if (authUser.dbRole === 'user') {
      whereClause = and(eq(orders.id, orderId), eq(orders.userId, authUser.id));
    } else if (authUser.dbRole === 'agent' || authUser.dbRole === 'sales') {
      whereClause = and(
        eq(orders.id, orderId),
        or(eq(orders.agentId, authUser.id), eq(orders.userId, authUser.id))
      );
    }
    
    await db.delete(orders).where(whereClause);

    // Hapus juga dari tabel drafts jika ID draf tersimpan di tabel drafts
    let draftWhere = or(eq(drafts.id, orderId), eq(drafts.themeId, orderId));
    if (authUser.dbRole !== 'admin') {
      draftWhere = and(
        or(eq(drafts.id, orderId), eq(drafts.themeId, orderId)),
        eq(drafts.userId, authUser.id)
      );
    }
    await db.delete(drafts).where(draftWhere);

    return { success: true };
  } catch (error) {
    console.error('Error deleting order/draft:', error);
    return { success: false, error: error.message };
  }
}
