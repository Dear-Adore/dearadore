'use client';
import { addPromocode, getPromocodes } from '../../actions/adminActions';


import { useState, useEffect } from 'react';
import { Tag, Plus, X, Edit2 } from 'lucide-react';

export default function PricingEnginePage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoFormData, setPromoFormData] = useState({ code: '', discountPercent: '', quota: '' });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);

    const resP = await getPromocodes();
    if (resP.success) setPromos(resP.data);
    setLoading(false);
  };

  const handleAddPromo = async (e) => {
    e.preventDefault();
    if (!promoFormData.code || !promoFormData.discountPercent) return;

    const res = await addPromocode(promoFormData.code, parseInt(promoFormData.discountPercent), parseInt(promoFormData.quota));
    if (res.success) {
      setIsPromoModalOpen(false);
      setPromoFormData({ code: '', discountPercent: '', quota: '' });
      fetchPricing();
    } else {
      alert('Gagal menambah promo: ' + res.error);
    }
  };



  return (
    <div className="admin-page-container relative">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">💰</span> Pricing Engine
          </div>
          <h1 className="admin-page-title">Pricing Engine</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Konfigurasi harga dasar, harga fitur tambahan (add-ons), dan manajemen kode promo / diskon.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchPricing}>
            <Tag size={14} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="admin-dashboard-grid">

        <div className="admin-card rules-card">
          <div className="card-header">
            <h3>Kode Promo Aktif</h3>
            <button className="admin-btn primary-light" onClick={() => setIsPromoModalOpen(true)} style={{padding: '0.3rem 0.6rem'}}>+ Promo</button>
          </div>
          <table className="admin-table compact">
            <thead><tr><th>Kode</th><th>Diskon</th><th>Kuota</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{textAlign:'center', padding:'1rem'}}>Memuat...</td></tr>
              ) : promos.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.code}</strong></td>
                  <td>{p.discountPercent}%</td>
                  <td>{p.used}/{p.quota} Terpakai</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROMO MODAL */}
      {isPromoModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '2rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tambah Kode Promo</h3>
              <button onClick={() => setIsPromoModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kode Promo</label>
                <input type="text" value={promoFormData.code} onChange={(e) => setPromoFormData({...promoFormData, code: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: DISKON10" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Diskon (%)</label>
                <input type="number" value={promoFormData.discountPercent} onChange={(e) => setPromoFormData({...promoFormData, discountPercent: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: 10" max="100" min="1" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kuota Maksimal</label>
                <input type="number" value={promoFormData.quota} onChange={(e) => setPromoFormData({...promoFormData, quota: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: 50" required />
              </div>
              <button type="submit" className="admin-btn primary" style={{ padding: '0.75rem', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>Simpan Promo</button>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}