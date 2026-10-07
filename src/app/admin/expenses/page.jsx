'use client';
import { createExpense, getExpenses } from '../../actions/adminActions';


import { useState, useEffect } from 'react';
import { CreditCard, Plus, X } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Operasional' });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);

    const res = await getExpenses();
    if (res.success) setExpenses(res.data);
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) return;

    const res = await createExpense(formData.title, parseInt(formData.amount), formData.category);
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ title: '', amount: '', category: 'Operasional' });
      fetchExpenses();
    } else {
      alert('Gagal menambah pengeluaran: ' + res.error);
    }
  };

  return (
    <div className="admin-page-container relative">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">💳</span> Expenses
          </div>
          <h1 className="admin-page-title">Pengeluaran Bisnis</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Lacak dan catat semua pengeluaran operasional, marketing, dan software dari Dear Adore.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchExpenses}>
            <CreditCard size={14} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="admin-card rules-card">
        <div className="card-header">
          <h3>Riwayat Pengeluaran</h3>
          <button className="admin-btn primary-light" onClick={() => setIsModalOpen(true)} style={{padding: '0.3rem 0.6rem'}}>Tambah Pengeluaran</button>
        </div>
        <table className="admin-table">
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'1rem'}}>Memuat...</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id}>
                <td>
                  <strong>{new Date(e.createdAt).toLocaleDateString('id-ID')}</strong><br/>
                  <span style={{fontSize:'0.7rem', color:'#6B7280'}}>{new Date(e.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}</span>
                </td>
                <td>{e.title}</td>
                <td>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#F3F4F6', color: '#4B5563', borderRadius: '4px' }}>
                    {e.category}
                  </span>
                </td>
                <td>Rp {e.amount.toLocaleString('id-ID')}</td>
                <td>
                  <span className={`badge ${e.status === 'Lunas' ? 'green' : 'yellow'}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && !loading && (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'1rem'}}>Tidak ada data pengeluaran</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '2rem', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tambah Pengeluaran</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Keterangan</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: Langganan Hosting Bulanan" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Jumlah (Rp)</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: 150000" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF' }} required>
                  <option value="Operasional">Operasional</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Software">Software & Hosting</option>
                  <option value="Aset">Aset</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <button type="submit" className="admin-btn primary" style={{ padding: '0.75rem', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>Simpan Pengeluaran</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
