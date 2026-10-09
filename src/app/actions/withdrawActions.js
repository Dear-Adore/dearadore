'use server';

import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { requireRole, ensureUserRow, getSessionUser } from '../../lib/auth';
import { getSalesDashboard } from './salesActions';


export async function requestWithdrawal(amount, paymentMethod, accountNumber) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');
    
    if (amount < 25000) throw new Error('Minimal penarikan adalah Rp 25.000');
    if (!paymentMethod || !accountNumber) throw new Error('Metode pembayaran dan nomor rekening wajib diisi.');

    const userSnap = await getDoc(doc(db, 'users', user.id));
    if (!userSnap.exists()) throw new Error('User not found');
    const role = userSnap.data().role;
    
    if (!['agent', 'sales'].includes(role)) {
      throw new Error('Hanya agent/sales yang bisa melakukan penarikan.');
    }

    const statsRes = await getMyStats();
    if (!statsRes.success || !statsRes.data) {
      throw new Error('Gagal mengambil data saldo agen.');
    }
    const availableBalance = statsRes.data.available;
    if (amount > availableBalance) {
      throw new Error(`Saldo tidak mencukupi. Maksimal penarikan: Rp ${availableBalance.toLocaleString('id-ID')}`);
    }

    const withdrawId = `wd_${Date.now()}_${Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')}`;
    
    await setDoc(doc(db, 'withdrawals', withdrawId), {
      id: withdrawId,
      agentId: user.id,
      amount,
      adminFee: 2500,
      paymentMethod,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    return { success: true, withdrawId };
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    return { success: false, error: error.message };
  }
}

export async function getWithdrawals(agentId = null) {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');
    
    const userSnap = await getDoc(doc(db, 'users', user.id));
    const role = userSnap.exists() ? userSnap.data().role : 'user';

    let q;
    if (role === 'agent' || role === 'sales') {
      q = query(collection(db, 'withdrawals'), where('agentId', '==', user.id), orderBy('createdAt', 'desc'));
    } else if (['admin', 'finance'].includes(role)) {
      if (agentId) {
        q = query(collection(db, 'withdrawals'), where('agentId', '==', agentId), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
      }
    } else {
      throw new Error('Unauthorized');
    }

    const snap = await getDocs(q);
    const data = [];
    for (const d of snap.docs) {
      const wd = { id: d.id, ...d.data() };
      const agentSnap = await getDoc(doc(db, 'users', wd.agentId));
      if (agentSnap.exists()) {
        wd.agentName = agentSnap.data().name;
      }
      data.push(wd);
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWithdrawal(withdrawId, proofUrl) {
  try {
    await requireRole(['admin', 'finance']);
    
    const wRef = doc(db, 'withdrawals', withdrawId);
    await updateDoc(wRef, { 
      status: 'completed', 
      proofUrl,
      completedAt: new Date().toISOString()
    });
      
    const wSnap = await getDoc(wRef);
    if (wSnap.exists()) {
      const expId = `exp_${Date.now()}`;
      await setDoc(doc(db, 'expenses', expId), {
        id: expId,
        title: `Pencairan Komisi Agen`,
        amount: wSnap.data().amount,
        category: 'Marketing / Komisi',
        status: 'Lunas',
        createdAt: new Date().toISOString()
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
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');

    const userSnap = await getDoc(doc(db, 'users', user.id));
    if (!userSnap.exists() || !['agent', 'sales'].includes(userSnap.data().role)) {
      return { success: true, data: null };
    }

    const dashboard = await getSalesDashboard();
    
    if (!dashboard.success) {
      return { success: false, error: dashboard.error };
    }

    const { stats } = dashboard.data;
    const totalCommission = stats.paidCommission;

    const wQuery = query(collection(db, 'withdrawals'), where('agentId', '==', user.id));
    const wSnap = await getDocs(wQuery);
    
    const withdrawn = wSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
    const available = totalCommission - withdrawn;

    return {
      success: true,
      data: {
        tier: 'Bronze',
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
