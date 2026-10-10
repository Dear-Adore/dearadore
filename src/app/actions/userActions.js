'use server';

import { db } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { requireRole } from '../../lib/auth';

const ROLES = ['user', 'agent', 'finance', 'sales', 'admin'];

export async function claimPromoCode(promoCode) {
  try {
    const { getSessionUser } = await import('../../lib/auth');
    const authUser = await getSessionUser();
    if (!authUser) throw new Error("Not logged in");

    const userRef = doc(db, 'users', authUser.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const userData = userSnap.data();

    const claimedPromos = userData.claimedPromos || [];
    if (claimedPromos.includes(promoCode)) {
      return { success: true, message: "Promo sudah diklaim sebelumnya." };
    }

    // Verify if this promo code actually exists in the database
    const qCheck = query(collection(db, 'promocodes'), where('code', '==', promoCode));
    const snap = await getDocs(qCheck);
    if (snap.empty) {
      return { success: false, error: "Kode promo tidak ditemukan di database." };
    }

    // Add to user's claimedPromos
    claimedPromos.push(promoCode);
    await updateDoc(userRef, { claimedPromos });

    return { success: true, message: `Promo ${promoCode} berhasil diklaim!` };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

export async function getUsers() {
  try {
    await requireRole(['admin', 'agent']);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = JSON.parse(JSON.stringify(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    const me = await requireRole(['admin']);
    if (!ROLES.includes(newRole)) throw new Error('Role tidak valid');
    if (userId === me.id && newRole !== 'admin') throw new Error('Tidak bisa menurunkan role sendiri');
    await updateDoc(doc(db, 'users', userId), { role: newRole });

    if (newRole === 'agent' || newRole === 'sales') {
      const pQuery = query(collection(db, 'promocodes'), where('agentId', '==', userId));
      const pSnap = await getDocs(pQuery);
      if (pSnap.empty) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars
        const promoCode = `ADORE${randomStr}`;
        const id = `promo_${Date.now()}`;
        await setDoc(doc(db, 'promocodes', id), {
          id,
          code: promoCode,
          discountPercent: 10,
          used: 0,
          quota: 9999,
          agentId: userId,
          createdAt: new Date().toISOString()
        });
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function syncUserToDatabase(userData) {
  try {
    const { id, email, name, phone } = userData;
    const userRef = doc(db, 'users', id);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id,
        email,
        name: name || email.split('@')[0],
        phone: phone || null,
        role: 'user',
        createdAt: new Date().toISOString()
      });
    } else {
      const updateData = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getSalesStats() {
  try {
    await requireRole(['admin', 'finance', 'agent', 'sales']);
    
    const agentsSnap = await getDocs(query(collection(db, 'users'), where('role', 'in', ['agent', 'sales'])));
    const agents = JSON.parse(JSON.stringify(agentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const promosSnap = await getDocs(collection(db, 'promocodes'));
    const allPromos = JSON.parse(JSON.stringify(promosSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const ordersSnap = await getDocs(query(collection(db, 'orders')));
    const allOrders = JSON.parse(JSON.stringify(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })))).filter(o => o.agentId);
    
    const wSnap = await getDocs(collection(db, 'withdrawals'));
    const allWithdrawals = JSON.parse(JSON.stringify(wSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const stats = agents.map(agent => {
      const agentPromo = allPromos.find(p => p.agentId === agent.id);
      const agentOrders = allOrders.filter(o => o.agentId === agent.id);
      const agentWithdrawals = allWithdrawals.filter(w => w.agentId === agent.id);
      
      const lunasOrders = agentOrders.filter(o => o.paymentStatus === 'paid');
      const totalSales = agentOrders.length;
      
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
    
    stats.sort((a, b) => b.sales - a.sales);
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
