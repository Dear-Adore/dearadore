import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/auth';
import AdminSidebar from '../../components/AdminSidebar';
import './admin.css';

export default async function AdminLayout({ children }) {
  const user = await getUserWithRole();

  if (!user) {
    redirect('/akun?next=/admin');
  }

  const allowedRoles = ['admin', 'agent', 'finance'];
  if (!allowedRoles.includes(user.dbRole)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Akses Ditolak</h2>
        <p>Anda tidak memiliki izin untuk mengakses halaman Admin.</p>
        <a href="/akun" style={{ color: '#4F46E5', marginTop: '1rem' }}>Kembali ke Akun</a>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar - Client Component */}
      <AdminSidebar user={user} />

      {/* Main Content */}
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}
