'use server';
import { createClient } from '../../lib/supabase/server';
import { users, expenses } from '../../db/schema';


import { db } from '../../db';
import { products, pricing_addons, promocodes, reviews, payouts } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '../../lib/auth';

const isStaff = () => requireRole(['admin', 'agent', 'finance']).then(() => true, () => false);

// -- CATALOG (PRODUCTS) --
export async function getProducts() {
  try {
    const data = await db.select().from(products).orderBy(desc(products.createdAt));
    return { success: true, data };
  } catch (error) {
    const hasDbUrl = !!process.env.DATABASE_URL;
    return { success: false, error: error.message + " | Has DB URL: " + hasDbUrl + " | Code: " + String(error.code) };
  }
}

export async function addProduct(name, category, price, previewImage, videoUrl, previewUrl, features, tags, colors) {
  try {
    await requireRole(['admin', 'agent']);
    await db.insert(products).values({
      id: crypto.randomUUID(), name, category, price, status: 'Aktif', previewImage, videoUrl, previewUrl, features, tags, colors
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProductStatus(id, status) {
  try {
    await requireRole(['admin', 'agent']);
    await db.update(products).set({ status }).where(eq(products.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id) {
  try {
    await requireRole(['admin', 'agent']);
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id, name, category, price, status, previewImage, videoUrl, previewUrl, features, tags, colors) {
  try {
    await requireRole(['admin', 'agent']);
    await db.update(products).set({
      name, category, price, status, previewImage, videoUrl, previewUrl, features, tags, colors
    }).where(eq(products.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// -- PRICING ENGINE (ADDONS & PROMOCODES) --
export async function getAddons() {
  try {
    const data = await db.select().from(pricing_addons);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateAddonPrice(id, price) {
  try {
    await requireRole(['admin', 'finance']);
    await db.update(pricing_addons).set({ price }).where(eq(pricing_addons.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createAddon(name, price) {
  try {
    await requireRole(['admin', 'finance']);
    await db.insert(pricing_addons).values({
      id: crypto.randomUUID(), name, price
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addPromocode(code, discountPercent, quota) {
  try {
    await requireRole(['admin', 'finance']);
    await db.insert(promocodes).values({
      id: crypto.randomUUID(), code, discountPercent, quota, used: 0
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


export async function getPromocodes() {
  try {
    await requireRole(['admin', 'finance']);
    const data = await db.select().from(promocodes);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// -- REVIEWS --
export async function getReviews() {
  try {

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let isStaff = false;
    if (user) {

      const me = await db.select().from(users).where(eq(users.id, user.id));
      if (me.length && ['admin', 'agent', 'finance'].includes(me[0].role)) {
        isStaff = true;
      }
    }

    const query = db.select().from(reviews).orderBy(desc(reviews.createdAt));
    if (!isStaff) {
      query.where(eq(reviews.status, 'Approved'));
    }

    const data = await query;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


export async function updateReviewStatus(id, status) {
  try {
    await requireRole(['admin', 'agent']);
    await db.update(reviews).set({ status }).where(eq(reviews.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// -- PAYOUTS & REVENUE --
export async function getPayouts() {
  try {
    await requireRole(['admin', 'finance']);
    const data = await db.select().from(payouts).orderBy(desc(payouts.createdAt));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createPayout(amount, destination) {
  try {
    await requireRole(['admin', 'finance']);
    await db.insert(payouts).values({
      id: crypto.randomUUID(), amount, destination, status: 'Pending', processedAt: null
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


export async function getExpenses() {
  try {

    await requireRole(['admin', 'finance']);
    const data = await db.select().from(expenses).orderBy(desc(expenses.createdAt));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function createExpense(title, amount, category) {
  try {

    await requireRole(['admin', 'finance']);
    await db.insert(expenses).values({
      id: crypto.randomUUID(), title, amount, category, status: 'Lunas', date: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

