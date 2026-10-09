'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Ticket, PlusCircle, LogOut, ShieldCheck, Wallet } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/sales' },
  { label: 'Track Promo', icon: Ticket, href: '/sales/promo' },
  { label: 'Buat Pesanan', icon: PlusCircle, href: '/sales/buat-pesanan' },
  { label: 'Withdraw', icon: Wallet, href: '/sales/withdraw' },
];

export default function SalesSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const displayName = user?.dbName || user?.email?.split('@')[0] || 'Sales';

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = 'firebase_uid=; path=/; max-age=0';
    router.push('/akun');
    router.refresh();
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <img src="/favicon.ico" alt="DearAdore" className="admin-brand-icon" />
        <div className="admin-brand-text">
          <h4>DearAdore Sales</h4>
          <p>Partner Dashboard</p>
        </div>
      </div>

      <div className="admin-sidebar-navs" style={{ paddingTop: '0.5rem' }}>
        <div className="admin-nav-group">
          <span className="admin-nav-group-title">MENU</span>
          {NAV.map(({ label, icon: Icon, href }) => {
            const isActive = href === '/sales' ? pathname === href : pathname?.startsWith(href);
            return (
              <Link key={href} href={href} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
        {user?.dbRole === 'admin' && (
          <div className="admin-nav-group">
            <span className="admin-nav-group-title">ADMIN</span>
            <Link href="/admin" className="admin-nav-item">
              <ShieldCheck size={16} />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </div>

      <div className="admin-sidebar-footer">
        <img
          src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
          alt={displayName}
          className="admin-avatar"
        />
        <div className="admin-user-info" style={{ flex: 1, overflow: 'hidden' }}>
          <h5 style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayName}</h5>
          <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', border: '1px solid #E5E7EB', borderRadius: '12px', background: '#F9FAFB', color: '#4F46E5', fontWeight: 600, display: 'inline-block', textTransform: 'uppercase' }}>
            {user?.dbRole}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0.25rem', display: 'flex', borderRadius: '4px' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
