'use client';
import { approveWithdrawal, getWithdrawals } from '../../actions/withdrawActions';


import { useState, useEffect } from 'react';
import { CreditCard, Upload } from 'lucide-react';

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);

    const res = await getWithdrawals(); // Admin gets all
    if (res.success) setWithdrawals(res.data);
    setLoading(false);
  };

  const handleUploadProof = async (e, withdrawId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(withdrawId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'dearadore_preset');
      formData.append('folder', `withdraw/${withdrawId}`);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dcwq2i77b'; // Fallback to their existing project cloud name if any, but since the env is typically available we just use it
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.secure_url) {

        const updateRes = await approveWithdrawal(withdrawId, data.secure_url);
        
        if (updateRes.success) {
          alert('Bukti bayar berhasil diupload dan status komisi cair!');
          fetchWithdrawals();
        } else {
          alert('Gagal update status: ' + updateRes.error);
        }
      } else {
        alert('Gagal upload ke Cloudinary');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat upload');
    }
    setUploadingId(null);
  };

  return (
    <div className="admin-page-container relative">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">💳</span> Withdrawals
          </div>
          <h1 className="admin-page-title">Penarikan Komisi Agen</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Kelola permintaan penarikan komisi dari agen dan sales. Upload bukti transfer untuk menyelesaikan.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchWithdrawals}>
            <CreditCard size={14} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="admin-card rules-card">
        <div className="card-header">
          <h3>Permintaan Penarikan Komisi</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Memuat data penarikan...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>ID Penarikan</th>
                    <th>Agen</th>
                    <th>Nominal (Bersih)</th>
                    <th>Metode & Rekening</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Aksi / Bukti</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                        Tidak ada riwayat penarikan
                      </td>
                    </tr>
                  ) : withdrawals.map(w => (
                    <tr key={w.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.id}</span></td>
                      <td>
                        <strong>{w.agentName || 'Unknown'}</strong><br />
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{w.agentId}</span>
                      </td>
                      <td>
                        <strong style={{ display: 'block', color: '#111827' }}>Rp {(w.amount - (w.adminFee || 2500)).toLocaleString('id-ID')}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Gross: Rp {w.amount.toLocaleString('id-ID')}</span>
                      </td>
                      <td>
                        <strong style={{ display: 'block' }}>{w.paymentMethod}</strong>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.accountNumber}</span>
                      </td>
                      <td>{new Date(w.createdAt).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span className={`admin-status-badge ${w.status === 'completed' ? 'success' : 'warning'}`}>
                          {w.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {w.status === 'completed' && w.proofUrl ? (
                          <a href={w.proofUrl} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 600 }}>
                            Lihat Bukti
                          </a>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <input 
                              type="file" 
                              id={`upload-${w.id}`}
                              style={{ display: 'none' }} 
                              onChange={(e) => handleUploadProof(e, w.id)} 
                              accept="image/*"
                            />
                            <label 
                              htmlFor={`upload-${w.id}`}
                              className="admin-btn secondary"
                              style={{ cursor: uploadingId === w.id ? 'wait' : 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <Upload size={14} />
                              {uploadingId === w.id ? 'Mengupload...' : 'Upload Bukti'}
                            </label>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}