'use client';

import { useState, useEffect } from 'react';
import { Target, Trophy, FileText, Gift, Zap, Users, Shield, Copy, Wallet } from 'lucide-react';
import { getSalesStats } from '../../actions/userActions';
import { getMyStats, getWithdrawals } from '../../actions/withdrawActions';

export default function SalesHubPage() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getSalesStats();
        if (res && res.success) {
          setAgents(res.data);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Disalin ke clipboard!');
  };

  // Hitung summary stats
  const totalPesanan = agents.reduce((acc, a) => acc + a.sales, 0);
  const totalLunas = agents.reduce((acc, a) => acc + a.lunas, 0);
  const totalBelumBayar = totalPesanan - totalLunas;
  const totalKomisi = agents.reduce((acc, a) => acc + a.commission, 0);

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">🔥</span> Underground Sales Army
          </div>
          <h1 className="admin-page-title">Sales & Affiliate Hub</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '700px' }}>
            Pantau performa Hero-Agent, Leaderboard, Gamifikasi, dan kelola Playbook Marketing untuk memaksimalkan profit perusahaan tanpa biaya iklan.
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-box">
          <div className="stat-title"><Target size={14} className="icon-purple" /> Total Pesanan</div>
          <div className="stat-value">{totalPesanan}</div>
          <div className="stat-trend positive">{totalPesanan} bulan ini</div>
        </div>
        <div className="stat-box">
          <div className="stat-title"><Shield size={14} className="icon-green" /> Lunas</div>
          <div className="stat-value">{totalLunas}</div>
          <div className="stat-trend positive">{totalLunas} pembayaran masuk</div>
        </div>
        <div className="stat-box">
          <div className="stat-title"><Users size={14} className="icon-gray" /> Belum Bayar</div>
          <div className="stat-value">{totalBelumBayar}</div>
          <div className="stat-trend normal">{totalBelumBayar} menunggu pembayaran</div>
        </div>
        <div className="stat-box">
          <div className="stat-title"><Zap size={14} className="icon-purple" /> Komisi</div>
          <div className="stat-value">Rp {totalKomisi.toLocaleString('id-ID')}</div>
          <div className="stat-trend positive">Rp {totalKomisi.toLocaleString('id-ID')} dari yang lunas</div>
        </div>
      </div>


      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'leaderboard' ? '2px solid #111827' : '2px solid transparent', color: activeTab === 'leaderboard' ? '#111827' : '#6B7280', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        ><Trophy size={16} /> Leaderboard & Gamifikasi</button>
        <button 
          onClick={() => setActiveTab('playbook')}
          style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'playbook' ? '2px solid #111827' : '2px solid transparent', color: activeTab === 'playbook' ? '#111827' : '#6B7280', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        ><FileText size={16} /> Marketing Playbook</button>
      </div>

      {activeTab === 'leaderboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
          
          <div className="admin-card">
            <div className="card-header">
              <h3>🏆 Leaderboard FOMO (Top 5 Agents)</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>Screenshot tabel ini dan kirim ke grup WhatsApp setiap Senin pagi untuk memicu persaingan antar agen.</p>
            
            <table className="admin-table compact">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Nama Agen (Kode)</th>
                  <th>Tier</th>
                  <th>Total Sales</th>
                  <th>Komisi Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem', color: '#6B7280'}}>Memuat data sales...</td></tr>
                ) : agents.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign: 'center', padding: '1rem', color: '#6B7280'}}>Belum ada agen sales yang terdaftar</td></tr>
                ) : (
                  agents.map((a, i) => (
                    <tr key={a.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#FEF08A' : i === 1 ? '#E5E7EB' : i === 2 ? '#FED7AA' : 'transparent', color: i < 3 ? '#92400E' : '#6B7280', fontWeight: 'bold' }}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{a.name}</strong><br/>
                        <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{a.code}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: a.tier === 'Gold' ? '#FEF08A' : a.tier === 'Silver' ? '#F3F4F6' : '#FFEDD5', color: '#92400E', fontWeight: 600 }}>{a.tier}</span>
                      </td>
                      <td>{a.sales} Paket</td>
                      <td style={{ fontWeight: 600, color: '#059669' }}>Rp {a.commission.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="admin-card" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Gift size={18} color="#D97706" />
                <h3 style={{ margin: 0, color: '#92400E', fontSize: '0.9rem' }}>The "Unlock" Bonus</h3>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400E' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Tier 1 (10 Sales):</strong> Bonus Rp 50.000</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Tier 2 (25 Sales):</strong> Bonus Rp 150.000</p>
                <p style={{ margin: 0 }}><strong>Tier 3 (50 Sales):</strong> Bonus Rp 400.000 + VIP Lane</p>
              </div>
            </div>

            <div className="admin-card" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Zap size={18} color="#DC2626" />
                <h3 style={{ margin: 0, color: '#991B1B', fontSize: '0.9rem' }}>Flash Bounty 48 Jam</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#991B1B', marginBottom: '1rem' }}>Umumkan di grup untuk memicu adrenalin mendadak (cashflow instan).</p>
              <button 
                onClick={() => copyToClipboard("🚨 FLASH BOUNTY 48 JAM! 🚨\nSiapapun yang bisa closing 3 Paket EXCLUSIVE dalam 48 jam ke depan, komisi Exclusive-nya NAIK dari Rp30.000 jadi Rp45.000 per transaksi! GASSS! 🔥")}
                className="admin-btn" style={{ background: '#DC2626', color: '#FFF', width: '100%', padding: '0.5rem', cursor: 'pointer' }}>
                <Copy size={12} /> Copy Broadcast Text
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'playbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> SOP Rescue Mission (Klien Organik)</h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '1rem' }}>Gunakan *script* ini saat ada klien organik komplain harga mahal agar laba 100% terselamatkan.</p>
            <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #111827', fontSize: '0.85rem', position: 'relative' }}>
              "Halo Kak! Betul harga resminya segitu. TAPI khusus hari ini, kebetulan banget Direktur kami lagi bagi-bagi 'Promo Flash Sale Internal'. Kalau kakak transaksi hari ini maksimal jam 5 sore, aku bisa bantu inputin kode voucher internal supaya kakak dapet diskon 20%. Harga paket Exclusive-nya langsung anjlok dari Rp255.000 jadi cuma Rp204.000. Mau aku bantu amankan vouchernya sekarang kak?"
              <button onClick={() => copyToClipboard("Halo Kak! Betul harga resminya segitu. TAPI khusus hari ini, kebetulan banget Direktur kami lagi bagi-bagi 'Promo Flash Sale Internal'. Kalau kakak transaksi hari ini maksimal jam 5 sore, aku bisa bantu inputin kode voucher internal supaya kakak dapet diskon 20%. Harga paket Exclusive-nya langsung anjlok dari Rp255.000 jadi cuma Rp204.000. Mau aku bantu amankan vouchernya sekarang kak?")} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} color="#6B7280" /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="admin-card">
              <h4 style={{ marginBottom: '0.5rem', color: '#111827' }}>1. Soft Selling (Teman/Kolega)</h4>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Pendekatan hangat tanpa memaksa.</p>
              <div style={{ background: '#F3F4F6', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontStyle: 'italic', position: 'relative', paddingRight: '2rem' }}>
                "Halo [Nama]! Kemarin liat update lamarannya, lancar terus ya! Eh btw, udah ada vendor undangan web belum? Kebetulan aku ada kode VIP Partner Dear Adore. Bisa dapet potongan 20% lho..."
                <button onClick={() => copyToClipboard("Halo [Nama]! Kemarin liat update lamarannya, lancar terus ya! Eh btw, udah ada vendor undangan web belum? Kebetulan aku ada kode VIP Partner Dear Adore. Bisa dapet potongan 20% lho...")} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} color="#9CA3AF" /></button>
              </div>
            </div>

            <div className="admin-card">
              <h4 style={{ marginBottom: '0.5rem', color: '#111827' }}>2. Hard Selling (Prospek Panas)</h4>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Mengunci klien dengan scarcity.</p>
              <div style={{ background: '#F3F4F6', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontStyle: 'italic', position: 'relative', paddingRight: '2rem' }}>
                "Kak [Nama], harga normal webnya Rp199.000 (Premium) atau Rp255.000 (Exclusive). Tapi karena kakak lewat aku, aku pakein kode Hero ya, jadi cuma Rp159.200 atau Rp204.000. Kodenya terbatas, mau di-lock sekarang?"
                <button onClick={() => copyToClipboard("Kak [Nama], harga normal webnya Rp199.000 (Premium) atau Rp255.000 (Exclusive). Tapi karena kakak lewat aku, aku pakein kode Hero ya, jadi cuma Rp159.200 atau Rp204.000. Kodenya terbatas, mau di-lock sekarang?")} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} color="#9CA3AF" /></button>
              </div>
            </div>

            <div className="admin-card">
              <h4 style={{ marginBottom: '0.5rem', color: '#111827' }}>3. The Upsell Trap</h4>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Memanfaatkan harga 'tanggung' Premium.</p>
              <div style={{ background: '#F3F4F6', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontStyle: 'italic', position: 'relative', paddingRight: '2rem' }}>
                "Saran aku pribadi sih, mending sekalian ambil yang Exclusive kak. Cuma nambah Rp44.800 doang, seharga 2 gelas kopi, tapi udah kebuka semua fitur VIP mentok. Gimana kak?"
                <button onClick={() => copyToClipboard("Saran aku pribadi sih, mending sekalian ambil yang Exclusive kak. Cuma nambah Rp44.800 doang, seharga 2 gelas kopi, tapi udah kebuka semua fitur VIP mentok. Gimana kak?")} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} color="#9CA3AF" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
