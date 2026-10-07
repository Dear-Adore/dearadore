'use server';

import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireRole } from '../../lib/auth';
import { promocodes } from '../../db/schema';
import { randomBytes } from 'crypto';

const ROLES = ['user', 'agent', 'finance', 'sales', 'admin'];

export async function getUsers() {
  try {
    await requireRole(['admin', 'agent']);
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return { success: true, data: allUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    const me = await requireRole(['admin']);
    if (!ROLES.includes(newRole)) throw new Error('Role tidak valid');
    if (userId === me.id && newRole !== 'admin') throw new Error('Tidak bisa menurunkan role sendiri');
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

    if (newRole === 'agent' || newRole === 'sales') {
      const existingPromo = await db.select().from(promocodes).where(eq(promocodes.agentId, userId));
      if (existingPromo.length === 0) {
        const randomStr = randomBytes(2).toString('hex').toUpperCase(); // 4 chars
        const promoCode = `ADORE${randomStr}`;
        await db.insert(promocodes).values({
          id: `promo_${Date.now()}`,
          code: promoCode,
          discountPercent: 10,
          used: 0,
          quota: 9999,
          agentId: userId
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
}

export async function syncUserToDatabase(userData) {
  try {
    const { id, email, name, phone } = userData;
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.id, id));
    
    if (existing.length === 0) {
      await db.insert(users).values({
        id,
        email,
        name: name || email.split('@')[0],
        phone: phone || null,
        role: 'user'
      });
    } else {
      // Update name if provided
      const updateData = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, id));
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error syncing user:', error);
    return { success: false, error: error.message };
  }
}

export async function getSalesStats() {
  try {
    await requireRole(['admin', 'finance', 'agent', 'sales']);
    
    // Get all users who have role 'agent' or 'sales'
    const agents = await db.select().from(users).where(sql`role IN ('agent', 'sales')`);
    
    // Get all promocodes
    const allPromos = await db.select().from(promocodes);
    
    // Get all orders that have an agentId
    const { orders, withdrawals } = await import('../../db/schema');
    const allOrders = await db.select().from(orders).where(sql`agent_id IS NOT NULL`);
    
    // Get all withdrawals
    const allWithdrawals = await db.select().from(withdrawals);
    
    const stats = agents.map(agent => {
      const agentPromo = allPromos.find(p => p.agentId === agent.id);
      const agentOrders = allOrders.filter(o => o.agentId === agent.id);
      const agentWithdrawals = allWithdrawals.filter(w => w.agentId === agent.id);
      
      const lunasOrders = agentOrders.filter(o => o.paymentStatus === 'paid');
      const totalSales = agentOrders.length;
      
      // Hitung komisi (misal: flat 30000 per paket untuk bronze, dsb. Tapi kita buat tier sederhana berdasarkan total sales)
      // Tier: Bronze (0-10), Silver (11-25), Gold (>25)
      let tier = 'Bronze';
      if (totalSales > 25) tier = 'Gold';
      else if (totalSales > 10) tier = 'Silver';
      
      const commissionRate = tier === 'Gold' ? 45000 : (tier === 'Silver' ? 35000 : 30000);
      const totalCommission = lunasOrders.length * commissionRate;
      
      const withdrawn = agentWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      const available = totalCommission - withdrawn;
      
      return {
        id: agent.id,
        name: agent.name,
        code: agentPromo ? agentPromo.code : 'BELUM ADA',
        tier,
        sales: totalSales,
        lunas: lunasOrders.length,
        commission: totalCommission,
        withdrawn,
        available
      };
    });
    
    // Sort by sales descending
    stats.sort((a, b) => b.sales - a.sales);
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    return { success: false, error: error.message };
  }
}
