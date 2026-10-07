'use server';
import { expenses } from '../../db/schema';
import { getSalesDashboard } from './salesActions';


import { db } from '../../db';
import { withdrawals, users } from '../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireRole, ensureUserRow } from '../../lib/auth';
import { createClient } from '../../lib/supabase/server';
import crypto from 'crypto';

export async function requestWithdrawal(amount, paymentMethod, accountNumber) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    if (amount < 25000) throw new Error('Minimal penarikan adalah Rp 25.000');
    if (!paymentMethod || !accountNumber) throw new Error('Metode pembayaran dan nomor rekening wajib diisi.');

    // Pastikan user adalah agent/sales
    const me = await db.select().from(users).where(eq(users.id, user.id));
    if (!me.length || !['agent', 'sales'].includes(me[0].role)) {
      throw new Error('Hanya agent/sales yang bisa melakukan penarikan.');
    }

    // --- PONYTAIL FIX: Validasi batas maksimal penarikan (Saldo Tersedia) ---
    const statsRes = await getMyStats();
    if (!statsRes.success || !statsRes.data) {
      throw new Error('Gagal mengambil data saldo agen.');
    }
    const availableBalance = statsRes.data.available;
    if (amount > availableBalance) {
      throw new Error(`Saldo tidak mencukupi. Maksimal penarikan: Rp ${availableBalance.toLocaleString('id-ID')}`);
    }

    const withdrawId = `wd_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    
    await db.insert(withdrawals).values({
      id: withdrawId,
      agentId: user.id,
      amount,
      adminFee: 2500,
      paymentMethod,
      accountNumber,
      status: 'pending'
    });

    return { success: true, withdrawId };
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    return { success: false, error: error.message };
  }
}

export async function getWithdrawals(agentId = null) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const me = await db.select().from(users).where(eq(users.id, user.id));
    const role = me[0]?.role || 'user';

    let query = db.select({
      id: withdrawals.id,
      agentId: withdrawals.agentId,
      agentName: users.name,
      amount: withdrawals.amount,
      adminFee: withdrawals.adminFee,
      paymentMethod: withdrawals.paymentMethod,
      accountNumber: withdrawals.accountNumber,
      status: withdrawals.status,
      proofUrl: withdrawals.proofUrl,
      createdAt: withdrawals.createdAt,
      completedAt: withdrawals.completedAt
    })
    .from(withdrawals)
    .leftJoin(users, eq(withdrawals.agentId, users.id))
    .orderBy(desc(withdrawals.createdAt));

    // Jika dipanggil oleh agen sendiri, filter berdasarkan ID agen.
    // Jika dipanggil oleh admin/finance, bisa lihat semua (kecuali agentId di-pass untuk filter)
    if (role === 'agent' || role === 'sales') {
      query.where(eq(withdrawals.agentId, user.id));
    } else if (['admin', 'finance'].includes(role) && agentId) {
      query.where(eq(withdrawals.agentId, agentId));
    } else if (!['admin', 'finance'].includes(role)) {
      throw new Error('Unauthorized');
    }

    const data = await query;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWithdrawal(withdrawId, proofUrl) {
  try {
    await requireRole(['admin', 'finance']);
    
    await db.update(withdrawals)
      .set({ 
        status: 'completed', 
        proofUrl,
        completedAt: new Date()
      })
      .where(eq(withdrawals.id, withdrawId));
      
    // (Opsional) Di sini bisa insert ke tabel expenses agar masuk ke data finance

    const wdInfo = await db.select().from(withdrawals).where(eq(withdrawals.id, withdrawId));
    
    if (wdInfo.length > 0) {
      await db.insert(expenses).values({
        id: `exp_${Date.now()}`,
        title: `Pencairan Komisi Agen`,
        amount: wdInfo[0].amount,
        category: 'Marketing / Komisi',
        status: 'Lunas'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return { success: false, error: error.message };
  }
}

export async function getMyStats() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const me = await db.select().from(users).where(eq(users.id, user.id));
    if (!me.length || !['agent', 'sales'].includes(me[0].role)) {
      return { success: true, data: null }; // not an agent
    }


    const dashboard = await getSalesDashboard();
    
    if (!dashboard.success) {
      return { success: false, error: dashboard.error };
    }

    const { stats } = dashboard.data;
    const totalCommission = stats.paidCommission;

    const agentWithdrawals = await db.select().from(withdrawals).where(eq(withdrawals.agentId, user.id));
    const withdrawn = agentWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const available = totalCommission - withdrawn;

    return {
      success: true,
      data: {
        tier: 'Bronze', // Tiers can be added back if needed later
        sales: stats.totalOrders,
        lunas: stats.paidOrders,
        commission: totalCommission,
        withdrawn,
        available
      }
    };
  } catch (error) {
    console.error('Error fetching my stats:', error);
    return { success: false, error: error.message };
  }
}
