'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, CheckCircle, Clock, Wallet, PlusCircle } from 'lucide-react';
import { getSalesDashboard } from '../actions/salesActions';

const rp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

export default function SalesDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSalesDashboard().then(res => (res.success ? setData(res.data) : setError(res.error)));
  }, []);

  if (error) return <div className="admin-page-container">Gagal memuat: {error}</div>;
  if (!data) return <div className="admin-page-container">Memuat...</div>;

  const { stats, orders } = data;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb"><span className="tag-icon">📈</span> Sales Dashboard</div>
          <h1 className="admin-page-title">Halo, {data.name}</h1>
        </div>
        <div className="admin-header-actions">
          <Link href="/sales/buat-pesanan" className="admin-btn primary">
            <PlusCircle size={14} /> Buat Pesanan
          </Link>
        </div>
      </div>

      <div className="admin-card stats-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><h3>Count Sales</h3></div>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-title"><ShoppingCart size={14} className="icon-purple" /> Total Pesanan</div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-trend normal">{stats.monthOrders} bulan ini</div>
          </div>
          <div className="stat-box">
            <div className="stat-title"><CheckCircle size={14} className="icon-green" /> Lunas</div>
            <div className="stat-value">{stats.paidOrders}</div>
            <div className="stat-trend normal">pembayaran masuk</div>
          </div>
          <div className="stat-box">
            <div className="stat-title"><Clock size={14} className="icon-purple" /> Belum Bayar</div>
            <div className="stat-value">{stats.unpaidOrders}</div>
            <div className="stat-trend normal">menunggu pembayaran</div>
          </div>
          <div className="stat-box">
            <div className="stat-title"><Wallet size={14} className="icon-gray" /> Komisi</div>
            <div className="stat-value">{rp(stats.totalCommission)}</div>
            <div className="stat-trend normal">{rp(stats.paidCommission)} dari yang lunas</div>
          </div>
        </div>
      </div>

      <div className="admin-card rules-card">
        <div className="card-header">
          <h3>Pesanan Terbaru</h3>
          <Link href="/sales/promo" className="admin-btn secondary" style={{ padding: '0.3rem 0.6rem' }}>Lihat semua</Link>
        </div>
        <OrdersTable orders={orders.slice(0, 5)} />
      </div>
    </div>
  );
}

function OrdersTable({ orders }) {
  return (
    <table className="admin-table compact">
      <thead>
        <tr><th>ID</th><th>Klien</th><th>Total</th><th>Komisi</th><th>Pembayaran</th></tr>
      </thead>
      <tbody>
        {orders.length === 0 ? (
          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>Belum ada pesanan.</td></tr>
        ) : orders.map(o => (
          <tr key={o.id}>
            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{o.id}</td>
            <td><strong>{o.clientName}</strong></td>
            <td>{rp(o.totalPrice)}</td>
            <td>{rp(o.commission)}</td>
            <td><span className={`badge ${o.paymentStatus === 'paid' ? 'green' : 'yellow'}`}>{o.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
