'use client';
import { addProduct, updateProduct, getProducts, deleteProduct } from '../../actions/adminActions';


import { useState, useEffect } from 'react';
import { Layers, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { colorOptions } from '../../../data/katalogData';

const GLOBAL_FEATURES = ['Video', 'Countdown Timer', 'Dress Code', 'Gallery', 'Amplop Digital', 'Menu Selection', 'Live Streaming', 'QR Code Check-in', 'Custom Domain .com'];
const AVAILABLE_TAGS = ['Wedding', 'Anniversary', 'Graduation', 'Ceremony', 'Baby Shower', 'Birthday'];

export default function CatalogManagerPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: 'Basic', price: 127000, previewImage: '', videoUrl: '', previewUrl: '', features: [], tags: [], colors: [] });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', status: '', name: '', category: '', price: '', previewImage: '', videoUrl: '', previewUrl: '', features: [], tags: [], colors: [] });

  const toggleEditFeature = (feature) => {
    setEditFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const toggleArrayItem = (setter, field, item) => {
    setter(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
 const res = await getProducts();
    if (res.success) setProducts(res.data);
    setLoading(false);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return;
    

    const res = await deleteProduct(id);
    if (res.success) {
      fetchProducts();
    } else {
      alert('Gagal menghapus produk: ' + res.error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    
    const res = await addProduct(
      formData.name, formData.category, parseInt(formData.price),
      formData.previewImage, formData.videoUrl, formData.previewUrl, formData.features, formData.tags, formData.colors
    );
    
    if (res.success) {
      setIsModalOpen(false);
      setFormData({ name: '', category: 'Basic', price: 127000, previewImage: '', videoUrl: '', previewUrl: '', features: [], tags: [], colors: [] });
      fetchProducts();
    } else {
      alert('Gagal menambah produk: ' + res.error);
    }
  };

  const openEditProduct = (p) => {
    setEditFormData({ 
      id: p.id, 
      status: p.status, 
      name: p.name,
      category: p.category || 'Basic',
      price: p.price || '',
      previewImage: p.previewImage || '',
      videoUrl: p.videoUrl || '',
      previewUrl: p.previewUrl || '',
      features: p.features || [],
      tags: p.tags || [],
      colors: p.colors || []
    });
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();

    const res = await updateProduct(
      editFormData.id, 
      editFormData.name, 
      editFormData.category, 
      parseInt(editFormData.price) || 0,
      editFormData.status,
      editFormData.previewImage, 
      editFormData.videoUrl,
      editFormData.previewUrl,
      editFormData.features, 
      editFormData.tags,
      editFormData.colors
    );
    if (res.success) {
      setIsEditModalOpen(false);
      fetchProducts();
    } else {
      alert('Gagal update produk: ' + res.error);
    }
  };

  return (
    <div className="admin-page-container relative">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">🛍️</span> Catalog Manager
          </div>
          <h1 className="admin-page-title">Catalog Manager</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Atur daftar undangan (tambah, edit, hapus), kelola kategori acara, dan perbarui gambar/demo.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn primary" onClick={fetchProducts}>
            <Layers size={14} /> Refresh
          </button>
        </div>
      </div>
      
      <div className="admin-card product-table-card">
        <div className="card-header">
          <h3>Daftar Produk (Katalog)</h3>
          <button className="admin-btn primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14}/> Tambah Produk
          </button>
        </div>
        <table className="admin-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding: '1rem'}}>Memuat...</td></tr>
            ) : products.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong><br/><span style={{fontSize:'0.7rem', color:'#6B7280'}}>{p.id.slice(0,8)}</span></td>
                <td>{p.category}</td>
                <td>Rp {p.price.toLocaleString('id-ID')}</td>
                <td><span className={`badge ${p.status === 'Aktif' ? 'green' : 'yellow'}`}>{p.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-btn secondary" onClick={() => openEditProduct(p)} style={{padding: '0.3rem 0.5rem'}}>
                      <Edit2 size={12} style={{marginRight: '0.2rem'}}/> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id, p.name)} style={{padding: '0.3rem 0.5rem', background: '#FEE2E2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.75rem'}}>
                      <Trash2 size={12} style={{marginRight: '0.2rem'}}/> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD PRODUCT MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem'
        }}>
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '2rem', width: '500px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tambah Produk Baru</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Tema</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: Royal Elegance" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori (Menentukan Harga)</label>
                  <select value={formData.category} onChange={(e) => {
                    const cat = e.target.value;
                    let pr = 127000;
                    if (cat === 'Premium') pr = 199000;
                    if (cat === 'Exclusive') pr = 255000;
                    setFormData({...formData, category: cat, price: pr});
                  }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF' }}>
                    <option value="Basic">Basic (Rp 127.000)</option>
                    <option value="Premium">Premium (Rp 199.000)</option>
                    <option value="Exclusive">Exclusive (Rp 255.000)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Gambar Thumbnail (URL)</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Media ini akan digunakan sebagai thumbnail di halaman <b>Katalog utama</b>. Disarankan format gambar potret (Format: JPG, PNG, WebP).
                </p>
                <input type="url" value={formData.previewImage} onChange={(e) => setFormData({...formData, previewImage: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.com/gambar.jpg" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Video Mockup iPhone (URL) - Opsional</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Video ini akan ditampilkan di dalam <b>mockup iPhone</b> pada halaman Detail Undangan. Kosongkan jika ingin menggunakan gambar thumbnail sebagai pengganti.
                </p>
                <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.com/video.mp4" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Link Preview (URL Live)</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Tautan menuju demo live undangan. Akan diarahkan ketika pengunjung mengklik tombol <b>Lihat Detail Produk</b>.
                </p>
                <input type="url" value={formData.previewUrl} onChange={(e) => setFormData({...formData, previewUrl: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.dearadore.site" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Tag Produk</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {AVAILABLE_TAGS.map(tag => (
                    <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#F3F4F6', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: formData.tags.includes(tag) ? '1px solid #111827' : '1px solid transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.tags.includes(tag)} 
                        onChange={() => toggleArrayItem(setFormData, 'tags', tag)}
                        style={{ margin: 0 }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Warna Produk</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {colorOptions.map(option => {
                    const isSelected = formData.colors.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        title={option.label}
                        onClick={() => toggleArrayItem(setFormData, 'colors', option.key)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: option.hex,
                          border: isSelected ? '2px solid #111827' : '1px solid #E5E7EB',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px #FFFFFF inset' : 'none',
                          padding: 0
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Fitur yang Tersedia</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {GLOBAL_FEATURES.map(feat => (
                    <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#F3F4F6', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: formData.features.includes(feat) ? '1px solid #111827' : '1px solid transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.features.includes(feat)} 
                        onChange={() => toggleFeature(feat)}
                        style={{ margin: 0 }}
                      />
                      {feat}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="admin-btn primary" style={{ padding: '0.75rem', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>Simpan Produk</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '2rem', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Produk: {editFormData.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
            </div>
            <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Nama Produk</label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="Contoh: Royal Elegance" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Kategori (Menentukan Harga)</label>
                  <select value={editFormData.category} onChange={(e) => {
                    const cat = e.target.value;
                    let pr = 127000;
                    if (cat === 'Premium') pr = 199000;
                    if (cat === 'Exclusive') pr = 255000;
                    setEditFormData({...editFormData, category: cat, price: pr});
                  }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF' }}>
                    <option value="Basic">Basic (Rp 127.000)</option>
                    <option value="Premium">Premium (Rp 199.000)</option>
                    <option value="Exclusive">Exclusive (Rp 255.000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Status Visibilitas</label>
                <select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FFF' }}>
                  <option value="Aktif">Aktif (Tampil di Katalog)</option>
                  <option value="Draft">Draft (Disembunyikan)</option>
                  <option value="Arsip">Diarsipkan</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Gambar Thumbnail (URL)</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Media ini akan digunakan sebagai thumbnail di halaman <b>Katalog utama</b>. Disarankan format gambar potret (Format: JPG, PNG, WebP).
                </p>
                <input type="url" value={editFormData.previewImage} onChange={(e) => setEditFormData({...editFormData, previewImage: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.com/gambar.jpg" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Video Mockup iPhone (URL) - Opsional</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Video ini akan ditampilkan di dalam <b>mockup iPhone</b> pada halaman Detail Undangan. Kosongkan jika ingin menggunakan gambar thumbnail sebagai pengganti.
                </p>
                <input type="url" value={editFormData.videoUrl} onChange={(e) => setEditFormData({...editFormData, videoUrl: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.com/video.mp4" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Link Preview (URL Live)</label>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                  Tautan menuju demo live undangan. Akan diarahkan ketika pengunjung mengklik tombol <b>Lihat Detail Produk</b>.
                </p>
                <input type="url" value={editFormData.previewUrl} onChange={(e) => setEditFormData({...editFormData, previewUrl: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB' }} placeholder="https://contoh.dearadore.site" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Tag Produk</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {AVAILABLE_TAGS.map(tag => (
                    <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#F3F4F6', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: editFormData.tags.includes(tag) ? '1px solid #111827' : '1px solid transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={editFormData.tags.includes(tag)} 
                        onChange={() => toggleArrayItem(setEditFormData, 'tags', tag)}
                        style={{ margin: 0 }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Warna Produk</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {colorOptions.map(option => {
                    const isSelected = editFormData.colors.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        title={option.label}
                        onClick={() => toggleArrayItem(setEditFormData, 'colors', option.key)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: option.hex,
                          border: isSelected ? '2px solid #111827' : '1px solid #E5E7EB',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 2px #FFFFFF inset' : 'none',
                          padding: 0
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 500 }}>Fitur yang Tersedia</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {GLOBAL_FEATURES.map(feat => (
                    <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', background: '#F3F4F6', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: editFormData.features.includes(feat) ? '1px solid #111827' : '1px solid transparent' }}>
                      <input 
                        type="checkbox" 
                        checked={editFormData.features.includes(feat)} 
                        onChange={() => toggleEditFeature(feat)}
                        style={{ margin: 0 }}
                      />
                      {feat}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="admin-btn primary" style={{ padding: '0.75rem', justifyContent: 'center', marginTop: '1rem', width: '100%' }}>Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}