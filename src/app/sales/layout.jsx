import { redirect } from 'next/navigation';
import { getUserWithRole } from '../../lib/auth';
import SalesSidebar from '../../components/SalesSidebar';
import '../admin/admin.css';

export default async function SalesLayout({ children }) {
  const user = await getUserWithRole();

  if (!user) {
    redirect('/akun?next=/sales');
  }

  if (!['sales', 'agent', 'admin'].includes(user.dbRole)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2>Akses Ditolak</h2>
        <p>Halaman ini hanya untuk role Sales dan Admin.</p>
        <a href="/akun" style={{ color: '#4F46E5', marginTop: '1rem' }}>Kembali ke Akun</a>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <SalesSidebar user={user} />
      <main className="admin-main-content">{children}</main>
    </div>
  );
}
