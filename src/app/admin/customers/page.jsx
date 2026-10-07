'use client';
import { getUsers } from '../../actions/userActions';


import { useState, useEffect } from 'react';
import { Users, UserCog, UserCheck, Shield, MoreHorizontal } from 'lucide-react';

export default function CustomerDirectoryPage() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const fetchUsers = async () => {
    try {

      const res = await getUsers();
      if (res.success) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAction = (action, userId) => {
    alert(`Fitur ${action} untuk user ${userId} sedang dalam pengembangan.`);
    setActiveDropdown(null);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-page-title-section">
          <div className="admin-breadcrumb">
            <span className="tag-icon">👥</span> Account & Client Management
          </div>
          <h1 className="admin-page-title">Manajemen Akun Klien & Tim</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '600px' }}>
            Kelola akun klien yang terdaftar, lihat detail, dan tetapkan role tim (Admin, Agent, Finance).
          </p>
        </div>
      </div>

      <div className="admin-card product-table-card">
        <div className="card-header">
          <h3>Daftar Akun Terdaftar</h3>
          <div className="search-box">
            <input type="text" placeholder="Cari nama/email..." />
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Akun</th>
              <th>Nama & Email</th>
              <th>Tanggal Bergabung</th>
              <th>Role Saat Ini</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Memuat data...</td></tr>
            ) : usersList.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Belum ada akun</td></tr>
            ) : (
              usersList.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', fontFamily: 'monospace' }}>
                      {user.id.substring(0, 8)}...
                    </span>
                  </td>
                  <td>
                    <strong>{user.name}</strong>
                    <span style={{fontSize:'0.7rem', color:'#6B7280'}}>{user.email}</span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'purple' : user.role === 'agent' ? 'yellow' : user.role === 'finance' ? 'green' : 'light-purple'}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button 
                      className="icon-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeDropdown === user.id && (
                      <div style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '2.5rem',
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                        minWidth: '140px',
                        textAlign: 'left',
                        overflow: 'hidden'
                      }}>
                        <button onClick={() => handleAction('Reset Password', user.id)} style={{ display: 'block', width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>Reset Password</button>
                        <button onClick={() => handleAction('Ban', user.id)} style={{ display: 'block', width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.8rem', color: '#D97706', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>Ban Account</button>
                        <button onClick={() => handleAction('Delete', user.id)} style={{ display: 'block', width: '100%', padding: '0.65rem 1rem', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.8rem', color: '#EF4444', cursor: 'pointer' }}>Delete Account</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}