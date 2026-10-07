'use client';
import { getReviews, updateReviewStatus } from '../../actions/adminActions';


import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

export default function ReviewAndTestimonialsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);

    const res = await getReviews();
    if (res.success) setReviews(res.data);
    setLoading(false);
  };

  const handleStatusChange = async (id, status) => {

    await updateReviewStatus(id, status);
    fetchReviews();
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">⭐</span> Review & Testimonials
          </div>
          <h1 className="admin-page-title">Review & Testimonials</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Moderasi ulasan dari klien. Setujui ulasan untuk ditampilkan di halaman utama (Testimoni).
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchReviews}>
            <Star size={14} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="admin-card rules-card">
        <div className="card-header"><h3>Moderasi Ulasan</h3></div>
        {loading ? (
          <p style={{padding:'1rem'}}>Memuat...</p>
        ) : reviews.map(r => (
          <div key={r.id} style={{ padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>{r.clientName} <span style={{fontSize:'0.75rem', color:'#6B7280'}}>({r.themeName})</span></strong>
              <div>
                <span style={{color: '#F59E0B', marginRight: '1rem'}}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                </span>
                <span className={`badge ${r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'yellow'}`}>
                  {r.status}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '1rem' }}>"{r.comment}"</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {r.status !== 'Approved' && <button className="admin-btn primary" onClick={() => handleStatusChange(r.id, 'Approved')} style={{padding: '0.3rem 0.6rem'}}>Approve</button>}
              {r.status !== 'Rejected' && <button className="admin-btn secondary" onClick={() => handleStatusChange(r.id, 'Rejected')} style={{padding: '0.3rem 0.6rem'}}>Reject</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}