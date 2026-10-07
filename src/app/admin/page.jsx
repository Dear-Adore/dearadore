'use client';
import { getOrders, createOrder } from '../actions/orderActions';


import { 
  RefreshCcw, 
  Download, 
  Plus, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Users, 
  Search,
  MoreHorizontal
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {

    const res = await getOrders();
    if (res.success) {
      setOrders(res.data);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">📦</span> Order Queue
          </div>
          <h1 className="admin-page-title">Manajemen Pesanan</h1>
        </div>
        <div className="admin-header-actions">
          <span className="refresh-status" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10B981' }}></span>
            Real-time Sync
          </span>
          <button className="admin-btn secondary">
            <RefreshCcw size={14} /> Sinkronisasi
          </button>
          <button className="admin-btn secondary">
            <Download size={14} /> Unduh Laporan
          </button>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        {/* Quick Stats Section */}
        <div className="admin-card stats-card">
          <div className="card-header">
            <h3>Statistik Pesanan</h3>
            <button className="icon-btn"><MoreHorizontal size={16} /></button>
          </div>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-title"><ShoppingCart size={14} className="icon-purple" /> Total Pesanan</div>
              <div className="stat-value">{orders.length}</div>
              <div className="stat-trend normal">total semua pesanan</div>
            </div>
            <div className="stat-box">
              <div className="stat-title"><Clock size={14} className="icon-purple" /> Proses / Ditunda</div>
              <div className="stat-value">{orders.filter(o => o.status !== 'completed').length}</div>
              <div className="stat-trend normal">menunggu & dikerjakan</div>
            </div>
            <div className="stat-box">
              <div className="stat-title"><CheckCircle size={14} className="icon-green" /> Selesai</div>
              <div className="stat-value">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="stat-trend normal">pesanan rampung</div>
            </div>
            <div className="stat-box">
              <div className="stat-title"><Users size={14} className="icon-gray" /> Total Klien</div>
              <div className="stat-value">{new Set(orders.map(o => o.name || 'Anonymous')).size}</div>
              <div className="stat-trend normal">klien unik</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
