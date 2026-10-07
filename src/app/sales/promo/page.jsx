'use client';

import { useEffect, useState } from 'react';
import { Copy, Ticket } from 'lucide-react';
import { getSalesDashboard } from '../../actions/salesActions';

const rp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function TrackPromoPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSalesDashboard().then(res => (res.success ? setData(res.data) : setError(res.error)));
  }, []);

  if (error) return <div className="admin-page-container">Gagal memuat: {error}</div>;
  if (!data) return <div className="admin-page-container">Memuat...</div>;

  const { promo, orders, stats } = data;

  const copy = () => {
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb"><span className="tag-icon">🎟️</span> Track Promo</div>
          <h1 className="admin-page-title">Kode Promo Saya</h1>
        </div>
      </div>

      <div className="admin-card stats-card" style={{ marginBottom: '1.5rem' }}>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-title"><Ticket size={14} className="icon-purple" /> Kode Promo</div>
            <div className="stat-value" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{promo.code}</div>
            <button className="admin-btn secondary" onClick={copy} style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>
              <Copy size={12} /> {copied ? 'Tersalin!' : 'Salin kode'}
            </button>
          </div>
          <div className="stat-box">
            <div className="stat-title">Diskon Klien</div>
            <div className="stat-value">{promo.discountPercent}%</div>
            <div className="stat-trend normal">otomatis saat kode dipakai</div>
          </div>
          <div className="stat-box">
            <div className="stat-title">Dipakai</div>
            <div className="stat-value">{stats.totalOrders}x</div>
            <div className="stat-trend normal">{stats.paidOrders} sudah lunas</div>
          </div>
        </div>
      </div>

      <div className="admin-card rules-card">
        <div className="card-header"><h3>Pesanan dengan Kode {promo.code}</h3></div>
        <table className="admin-table compact">
          <thead>
            <tr><th>Tanggal</th><th>ID</th><th>Klien</th><th>Sumber</th><th>Total</th><th>Komisi</th><th>Pembayaran</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>Kode belum pernah dipakai.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td>{new Date(o.createdAt).toLocaleDateString('id-ID')}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{o.id}</td>
                <td><strong>{o.clientName}</strong></td>
                <td>{o.source}</td>
                <td>{rp(o.totalPrice)}</td>
                <td>{rp(o.commission)}</td>
                <td><span className={`badge ${o.paymentStatus === 'paid' ? 'green' : 'yellow'}`}>{o.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
