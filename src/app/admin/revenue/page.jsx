'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Plus, MoreHorizontal, Filter } from 'lucide-react';
import { getOrders } from '../../actions/orderActions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueDeskPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('monthly'); // 'daily', 'monthly', 'yearly'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getOrders();
    if (res.success) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const getChartData = () => {
    const validOrders = [...completedOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const grouped = {};

    validOrders.forEach(order => {
      const d = new Date(order.createdAt);
      let key = '';
      if (filterType === 'daily') {
        key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      } else if (filterType === 'monthly') {
        key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      } else {
        key = d.getFullYear().toString();
      }

      if (!grouped[key]) grouped[key] = { name: key, revenue: 0 };
      grouped[key].revenue += order.totalPrice || 0;
    });

    return Object.values(grouped);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">📈</span> Revenue Desk
          </div>
          <h1 className="admin-page-title">Revenue Desk</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Laporan keuangan, pendapatan kotor (Gross Volume), laba bersih, dan metrik penjualan. (Hanya menghitung order berstatus Completed).
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchData}>
            <TrendingUp size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <>
          <div className="admin-dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="admin-card stats-card">
              <div className="card-header"><h3>Total Pendapatan</h3></div>
              <div style={{fontSize: '1.5rem', fontWeight: 800}}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
              <div style={{color: '#10B981', fontSize: '0.8rem'}}>Dari {completedOrders.length} order selesai</div>
            </div>
            <div className="admin-card stats-card">
              <div className="card-header"><h3>Rata-rata Order Value</h3></div>
              <div style={{fontSize: '1.5rem', fontWeight: 800}}>Rp {Math.round(avgOrderValue).toLocaleString('id-ID')}</div>
            </div>
            <div className="admin-card stats-card">
              <div className="card-header"><h3>Total Keseluruhan Order</h3></div>
              <div style={{fontSize: '1.5rem', fontWeight: 800}}>{orders.length}</div>
            </div>
          </div>
          <div className="admin-card product-table-card" style={{ marginTop: '1.5rem', paddingBottom: '2rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Grafik Pendapatan</h3>
              <div style={{ display: 'flex', gap: '0.5rem', background: '#F3F4F6', padding: '0.2rem', borderRadius: '8px' }}>
                <button 
                  onClick={() => setFilterType('daily')}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterType === 'daily' ? '#FFFFFF' : 'transparent', color: filterType === 'daily' ? '#111827' : '#6B7280', boxShadow: filterType === 'daily' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                  Harian
                </button>
                <button 
                  onClick={() => setFilterType('monthly')}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterType === 'monthly' ? '#FFFFFF' : 'transparent', color: filterType === 'monthly' ? '#111827' : '#6B7280', boxShadow: filterType === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                  Bulanan
                </button>
                <button 
                  onClick={() => setFilterType('yearly')}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: filterType === 'yearly' ? '#FFFFFF' : 'transparent', color: filterType === 'yearly' ? '#111827' : '#6B7280', boxShadow: filterType === 'yearly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                  Tahunan
                </button>
              </div>
            </div>
            
            <div style={{ height: '350px', width: '100%', marginTop: '2rem' }}>
              {getChartData().length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                  Tidak ada data untuk ditampilkan.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis 
                      tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6B7280', fontSize: 12}} 
                      dx={-10}
                    />
                    <Tooltip 
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="revenue" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}