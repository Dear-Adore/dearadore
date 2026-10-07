'use client';
import { deleteOrder, updateOrderLinks } from '../../actions/orderActions';


import { useState, useEffect } from 'react';
import { ShoppingCart, Copy, Check } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../actions/orderActions';

const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy} 
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10B981' : '#6B7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }} 
      title="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label && <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{copied ? 'Copied!' : label}</span>}
    </button>
  );
};

export default function OrderQueuePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Link Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [linkData, setLinkData] = useState({ previewUrl: '', rsvpUrl: '' });

  const [activeTab, setActiveTab] = useState('project');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const res = await getOrders();
    if (res.success) {
      // Filter out 'ditunda'
      const validOrders = res.data.filter(o => o.status !== 'ditunda');
      setOrders(validOrders);
    }
    setLoading(false);
  };

  const handleOpenDetail = (order) => {
    setDetailOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenKirim = (order) => {
    setSelectedOrder(order);
    setLinkData({
      previewUrl: order.packageData?.previewUrl || '',
      rsvpUrl: order.packageData?.rsvpUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveKirim = async () => {

    await updateOrderLinks(selectedOrder.id, linkData.previewUrl, linkData.rsvpUrl, 3, selectedOrder.packageData);
    setIsModalOpen(false);
    fetchOrders();
  };

  const handleCancel = async (orderId) => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mengcancel dan MENGHAPUS pesanan ini secara permanen dari database?')) {

      await deleteOrder(orderId);
      fetchOrders();
    }
  };

  const calculateDeadline = (createdAt) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const currentList = activeTab === 'project' 
    ? orders.filter(o => o.status !== 'selesai')
    : orders.filter(o => o.status === 'selesai');

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">📦</span> Antrean Pesanan
          </div>
          <h1 className="admin-page-title">Daftar Pesanan</h1>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchOrders}>
            <ShoppingCart size={14} /> Segarkan Data
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('project')}
          style={{ background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: activeTab === 'project' ? 600 : 400, color: activeTab === 'project' ? '#2563EB' : '#6B7280', cursor: 'pointer', padding: '0.2rem 0' }}
        >
          Dalam Proses
        </button>
        <button 
          onClick={() => setActiveTab('complete')}
          style={{ background: 'none', border: 'none', fontSize: '0.9rem', fontWeight: activeTab === 'complete' ? 600 : 400, color: activeTab === 'complete' ? '#2563EB' : '#6B7280', cursor: 'pointer', padding: '0.2rem 0' }}
        >
          Selesai
        </button>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>ID Pesanan</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Nama Pemesan</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Batas Waktu</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>{o.id}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>{o.clientName || 'Tanpa Nama'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4B5563' }}>{calculateDeadline(o.createdAt)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleOpenDetail(o)}
                        style={{ padding: '0.3rem 0.75rem', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Detail
                      </button>
                      <button 
                        onClick={() => handleOpenKirim(o)}
                        style={{ padding: '0.3rem 0.75rem', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {activeTab === 'complete' ? 'Edit Link' : 'Kirim'}
                      </button>
                      <button 
                        onClick={() => handleCancel(o.id)}
                        style={{ padding: '0.3rem 0.75rem', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Batal
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#6B7280' }}>Tidak ada {activeTab === 'project' ? 'pesanan yang belum selesai' : 'pesanan yang sudah selesai'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pop Up Form Kirim */}
      {isModalOpen && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Kirim Undangan</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Link Preview Live</label>
              <input 
                type="text" 
                value={linkData.previewUrl}
                onChange={e => setLinkData(p => ({ ...p, previewUrl: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Link RSVP</label>
              <input 
                type="text" 
                value={linkData.rsvpUrl}
                onChange={e => setLinkData(p => ({ ...p, rsvpUrl: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.5rem 1rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Tutup
              </button>
              <button 
                onClick={handleSaveKirim}
                style={{ padding: '0.5rem 1rem', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop Up Detail Pesanan */}
      {isDetailModalOpen && detailOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Detail Pesanan Client</h3>
            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* Section 1: Identitas & Kontak */}
              <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#111827' }}>Identitas & Kontak</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                  <strong>ID Pesanan:</strong> <span>{detailOrder.id}</span> <CopyButton text={detailOrder.id} />
                  <strong>Nama Client:</strong> <span>{detailOrder.clientName || 'Tanpa Nama'}</span> <CopyButton text={detailOrder.clientName || 'Tanpa Nama'} />
                  <strong>Email Client:</strong> <span>{detailOrder.clientEmail || 'Tanpa Email'}</span> <CopyButton text={detailOrder.clientEmail || 'Tanpa Email'} />
                  <strong>No WhatsApp:</strong> <span>{detailOrder.clientWa || 'Tanpa WA'}</span> <CopyButton text={detailOrder.clientWa || 'Tanpa WA'} />
                </div>
              </div>

              {/* Section 2: Ringkasan Pesanan */}
              <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#111827' }}>Ringkasan Pesanan</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                  <strong>Tema:</strong> <span>{detailOrder.themeName}</span> <CopyButton text={detailOrder.themeName} />
                  <strong>Total Harga:</strong> <span>{detailOrder.totalPrice ? `Rp ${detailOrder.totalPrice.toLocaleString('id-ID')}` : '-'}</span> <span></span>
                </div>
              </div>

              {/* Section 3: Esensial */}
              {detailOrder.packageData?.essentialFeatures && (
                <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#111827' }}>Data Esensial</h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>1. Acara</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                      <strong>Nama Acara:</strong> <span>{detailOrder.packageData.essentialFeatures.acara?.eventName}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.acara?.eventName} />
                      <strong>Jenis Acara:</strong> <span>{detailOrder.packageData.essentialFeatures.acara?.eventType}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.acara?.eventType} />
                      <strong>Pemilik Acara:</strong> <span>{detailOrder.packageData.essentialFeatures.acara?.eventHosts?.join(' & ')}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.acara?.eventHosts?.join(' & ')} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>2. Pesan Undangan</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                      <strong>Kepada Yth:</strong> <span>{detailOrder.packageData.essentialFeatures.pesanUndangan?.guestGreetingFormat}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.pesanUndangan?.guestGreetingFormat} />
                      <strong>Kutipan:</strong> <span>{detailOrder.packageData.essentialFeatures.pesanUndangan?.quotesMessage}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.pesanUndangan?.quotesMessage} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>3. Detail Acara</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                      <strong>Tanggal:</strong> <span>{detailOrder.packageData.essentialFeatures.detailAcara?.eventDate}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.detailAcara?.eventDate} />
                      <strong>Waktu:</strong> <span>{detailOrder.packageData.essentialFeatures.detailAcara?.eventTime}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.detailAcara?.eventTime} />
                      <strong>Tempat:</strong> <span>{detailOrder.packageData.essentialFeatures.detailAcara?.eventVenue}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.detailAcara?.eventVenue} />
                      <strong>Alamat:</strong> <span>{detailOrder.packageData.essentialFeatures.detailAcara?.eventAddress}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.detailAcara?.eventAddress} />
                      <strong>Maps URL:</strong> <span>{detailOrder.packageData.essentialFeatures.detailAcara?.eventMapsUrl}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.detailAcara?.eventMapsUrl} />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Media</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                      <strong>Musik:</strong> <span>{detailOrder.packageData.essentialFeatures.musik?.title} - {detailOrder.packageData.essentialFeatures.musik?.artist}</span> <CopyButton text={`${detailOrder.packageData.essentialFeatures.musik?.title} - ${detailOrder.packageData.essentialFeatures.musik?.artist}`} />
                      <strong>Link Musik:</strong> <span>{detailOrder.packageData.essentialFeatures.musik?.linkUrl || '-'}</span> <CopyButton text={detailOrder.packageData.essentialFeatures.musik?.linkUrl || ''} />
                      <strong>Video URL:</strong> <span>{detailOrder.packageData.enableVideo ? detailOrder.packageData.videoUrl : '-'}</span> <CopyButton text={detailOrder.packageData.videoUrl || ''} />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Tambahan */}
              {detailOrder.packageData?.additionalFeatures && Object.values(detailOrder.packageData.additionalFeatures).some(f => f.active || f.enabled) && (
                <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#111827' }}>Fitur Tambahan (Aktif)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    
                    {/* Countdown Timer */}
                    {detailOrder.packageData.additionalFeatures.countdownTimer?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Countdown Timer</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Judul:</strong> <span>{detailOrder.packageData.additionalFeatures.countdownTimer.title || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.countdownTimer.title || ''} />
                          <strong>Target Tanggal:</strong> <span>{detailOrder.packageData.additionalFeatures.countdownTimer.targetDate || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.countdownTimer.targetDate || ''} />
                        </div>
                      </div>
                    )}

                    {/* Amplop Digital / Gift */}
                    {detailOrder.packageData.additionalFeatures.gift?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Amplop Digital (Gift)</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Bank:</strong> <span>{detailOrder.packageData.additionalFeatures.gift.bankName || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gift.bankName || ''} />
                          <strong>No. Rekening:</strong> <span>{detailOrder.packageData.additionalFeatures.gift.accountNumber || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gift.accountNumber || ''} />
                          <strong>Atas Nama:</strong> <span>{detailOrder.packageData.additionalFeatures.gift.accountHolder || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gift.accountHolder || ''} />
                          <strong>Alamat Fisik:</strong> <span>{detailOrder.packageData.additionalFeatures.gift.physicalAddress || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gift.physicalAddress || ''} />
                          <strong>Tombol Tambahan:</strong> <span>{detailOrder.packageData.additionalFeatures.gift.buttons?.map(b => `${b.label}: ${b.url}`).join(' | ') || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gift.buttons?.map(b => `${b.label}: ${b.url}`).join(' | ') || ''} />
                        </div>
                      </div>
                    )}

                    {/* Dress Code */}
                    {detailOrder.packageData.additionalFeatures.dressCode?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Dress Code</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Keterangan:</strong> <span>{detailOrder.packageData.additionalFeatures.dressCode.text || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.dressCode.text || ''} />
                          <strong>Warna:</strong> 
                          <span style={{ display: 'flex', gap: '0.5rem' }}>
                            {detailOrder.packageData.additionalFeatures.dressCode.colors?.length > 0 
                              ? detailOrder.packageData.additionalFeatures.dressCode.colors.map(c => (
                                  <span key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: '1px solid #CCC' }} />
                                    {c.name}
                                  </span>
                                ))
                              : '-'
                            }
                          </span>
                          <CopyButton text={detailOrder.packageData.additionalFeatures.dressCode.colors?.map(c => c.name).join(', ') || ''} />
                        </div>
                      </div>
                    )}

                    {/* Gallery */}
                    {detailOrder.packageData.additionalFeatures.gallery?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Gallery & Video Teaser</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Jumlah Foto:</strong> <span>{detailOrder.clientPhotos?.length || detailOrder.packageData.additionalFeatures.gallery.photosCount || 0} Foto Diunggah</span> <span></span>
                          
                          {detailOrder.clientPhotos && detailOrder.clientPhotos.length > 0 && (
                            <>
                              <strong>Daftar Foto:</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {detailOrder.clientPhotos.map((photo, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {photo.isMain && (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Foto Utama">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                      </svg>
                                    )}
                                    <a href={photo.url} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                      {photo.fileName || `Foto ${i + 1}`}
                                    </a>
                                  </div>
                                ))}
                              </div>
                              <CopyButton text={detailOrder.clientPhotos.map(p => p.url).join('\n')} />
                            </>
                          )}

                          <strong>Video Teaser:</strong> <span>{detailOrder.packageData.additionalFeatures.gallery.videoTeaserUrl || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.gallery.videoTeaserUrl || ''} />
                        </div>
                      </div>
                    )}

                    {/* Menu Selection */}
                    {detailOrder.packageData.additionalFeatures.menuSelection?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Menu Selection & RSVP</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Opsi Menu:</strong> <span>{detailOrder.packageData.additionalFeatures.menuSelection.options || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.menuSelection.options || ''} />
                          <strong>Tanya Diet:</strong> <span>{detailOrder.packageData.additionalFeatures.menuSelection.askDietary ? 'Ya' : 'Tidak'}</span> <span></span>
                          <strong>Tanya Jumlah Tamu:</strong> <span>{detailOrder.packageData.additionalFeatures.menuSelection.askGuestCount ? 'Ya' : 'Tidak'}</span> <span></span>
                        </div>
                      </div>
                    )}

                    {/* Live Streaming */}
                    {detailOrder.packageData.additionalFeatures.liveStreaming?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>Live Streaming</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Platform:</strong> <span>{detailOrder.packageData.additionalFeatures.liveStreaming.platform || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.liveStreaming.platform || ''} />
                          <strong>Tautan:</strong> <span>{detailOrder.packageData.additionalFeatures.liveStreaming.url || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.liveStreaming.url || ''} />
                          <strong>Waktu:</strong> <span>{detailOrder.packageData.additionalFeatures.liveStreaming.time || '-'}</span> <CopyButton text={detailOrder.packageData.additionalFeatures.liveStreaming.time || ''} />
                        </div>
                      </div>
                    )}

                    {/* QR Code Check-in */}
                    {detailOrder.packageData.additionalFeatures.qrCheckin?.active && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.3rem', color: '#4B5563' }}>QR Code Check-in</strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', alignItems: 'center', paddingLeft: '0.5rem' }}>
                          <strong>Status:</strong> <span>Aktif</span> <span></span>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              )}

              {/* Section 5: Data Form Client (Raw JSON) */}
              <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#111827' }}>Data Lengkap (Raw JSON)</h4>
                  <CopyButton text={JSON.stringify(detailOrder.packageData, null, 2)} label="Copy JSON" />
                </div>
                <pre style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.75rem', margin: 0 }}>
                  {JSON.stringify(detailOrder.packageData, null, 2)}
                </pre>
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                style={{ padding: '0.5rem 1rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}