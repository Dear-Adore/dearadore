'use server';

import { db } from '../../db';
import { drafts, favorites, promocodes, users } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { createClient } from '../../lib/supabase/server';
import { ensureUserRow } from '../../lib/auth';

export async function saveDraft(themeId, themeName, formData) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();


    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }
    await ensureUserRow(user);

    // Check if draft already exists for this user and theme
    const existing = await db.select().from(drafts).where(
      and(eq(drafts.userId, user.id), eq(drafts.themeId, themeId))
    );

    if (existing.length > 0) {
      await db.update(drafts)
        .set({ formData, updatedAt: new Date() })
        .where(eq(drafts.id, existing[0].id));
    } else {
      await db.insert(drafts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        themeId,
        themeName,
        formData,
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const [userRow] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id));
    const role = userRow?.role || 'user';

    let whereClause = and(
      or(eq(drafts.themeId, identifier), eq(drafts.id, identifier)),
      eq(drafts.userId, user.id)
    );

    if (role === 'admin') {
      whereClause = or(eq(drafts.themeId, identifier), eq(drafts.id, identifier));
    }

    await db.delete(drafts).where(whereClause);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleFavorite(themeId) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }
    await ensureUserRow(user);

    const existing = await db.select().from(favorites).where(
      and(eq(favorites.userId, user.id), eq(favorites.productId, themeId))
    );

    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return { success: true, isFavorite: false };
    } else {
      await db.insert(favorites).values({
        id: crypto.randomUUID(),
        userId: user.id,
        productId: themeId,
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [] };
    }

    const data = await db.select().from(favorites).where(eq(favorites.userId, user.id));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserDrafts() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, data: [] };
    }

    const data = await db.select().from(drafts).where(eq(drafts.userId, user.id));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function validatePromoCode(code) {
  try {
    const data = await db.select().from(promocodes).where(eq(promocodes.code, code));
    if (data.length === 0) {
      return { success: false, error: 'Kode promo tidak valid atau sudah kadaluarsa.' };
    }
    const promo = data[0];
    if (promo.used >= promo.quota) {
      return { success: false, error: 'Kuota kode promo sudah habis.' };
    }
    return { success: true, discountPercent: promo.discountPercent };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return { success: false, error: error.message };
  }
}
