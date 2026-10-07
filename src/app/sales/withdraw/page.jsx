'use client';
import { requestWithdrawal } from '../../actions/withdrawActions';


import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { getMyStats, getWithdrawals } from '../../actions/withdrawActions';

export default function SalesWithdrawPage() {
  const [agentStats, setAgentStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [myStatsRes, wdRes] = await Promise.all([
          getMyStats(),
          getWithdrawals()
        ]);
        
        if (myStatsRes && myStatsRes.success && myStatsRes.data) {
          setAgentStats(myStatsRes.data);
        }
        if (wdRes && wdRes.success) {
          setWithdrawals(wdRes.data);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) return <div className="admin-page-container">Memuat...</div>;
  if (!agentStats) return <div className="admin-page-container">Data tidak ditemukan.</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb"><span className="tag-icon">💳</span> Withdraw Komisi</div>
          <h1 className="admin-page-title">Pencairan Dana</h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>Saldo Tersedia</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>Rp {agentStats.available.toLocaleString('id-ID')}</div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="number" 
                placeholder="Nominal Penarikan (Min. Rp 25.000)" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%' }}
              />
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%' }}
              >
                <optgroup label="Transfer Bank">
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="BSI">BSI</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Permata</option>
                </optgroup>
                <optgroup label="E-Wallet">
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="DANA">DANA</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="LinkAja">LinkAja</option>
                </optgroup>
              </select>
              <input 
                type="text" 
                placeholder="No. Rekening / No. HP (E-Wallet)" 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB', width: '100%' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>* Potongan biaya admin: Rp 2.500</div>
              <button 
                onClick={async () => {
                  const amt = parseInt(withdrawAmount);
                  if (!amt || amt < 25000 || amt > agentStats.available) return alert('Nominal tidak valid (Minimal Rp 25.000)!');
                  if (!accountNumber) return alert('No rekening/telepon wajib diisi!');

                  const res = await requestWithdrawal(amt, paymentMethod, accountNumber);
                  if (res.success) {
                    alert('Penarikan berhasil diajukan!');
                    window.location.reload();
                  } else {
                    alert('Gagal: ' + res.error);
                  }
                }}
                style={{ padding: '0.5rem 1rem', background: '#111827', color: 'white', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', marginTop: '0.5rem' }}
              >
                Tarik Komisi
              </button>
            </div>
          </div>
          <div style={{ padding: '1.5rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Komisi Keseluruhan</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>Rp {agentStats.commission.toLocaleString('id-ID')}</div>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Ditarik</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#DC2626' }}>Rp {agentStats.withdrawn.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <h3>Riwayat Penarikan Komisi</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Penarikan</th>
                <th>Tanggal</th>
                <th>Nominal (Bersih)</th>
                <th>Status</th>
                <th>Bukti Bayar</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#6B7280' }}>Belum ada riwayat penarikan</td></tr>
              ) : withdrawals.map(w => (
                <tr key={w.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.id}</span></td>
                  <td>{new Date(w.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <strong style={{ display: 'block' }}>Rp {(w.amount - w.adminFee).toLocaleString('id-ID')}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Potongan admin: Rp {w.adminFee.toLocaleString('id-ID')}</span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${w.status === 'completed' ? 'success' : 'warning'}`}>
                      {w.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {w.proofUrl ? <a href={w.proofUrl} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>Lihat Bukti</a> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
