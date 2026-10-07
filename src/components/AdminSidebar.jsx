'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Settings,
  Bell,
  Wallet,
  Activity,
  FileText,
  Search,
  MessageSquare,
  LogOut,
  CreditCard
} from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeRole = user?.dbRole || 'user';
  const displayName = user?.dbName || user?.email?.split('@')[0] || 'Unknown';

  // Define role permissions
  const rolePermissions = {
    admin: ['*'],
    agent: ['Overview', 'Order Queue', 'Catalog', 'Customers', 'Reviews', 'Sales Hub'],
    finance: ['Overview', 'Pricing Engine', 'Revenue Desk', 'Payouts', 'Expenses', 'Sales Hub'],
    sales: ['Overview', 'Order Queue', 'Sales Hub'],
    user: [] // Users have no admin access
  };

  const navGroups = [
    {
      title: 'COMMAND',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
      ],
    },
    {
      title: 'COMMERCE',
      items: [
        { label: 'Order Queue', icon: ShoppingCart, href: '/admin/orders' },
        { label: 'Catalog', icon: ImageIcon, href: '/admin/catalog' },
        { label: 'Pricing Engine', icon: Wallet, href: '/admin/pricing' },
        { label: 'Customers', icon: Users, href: '/admin/customers' },
        { label: 'Reviews', icon: MessageSquare, href: '/admin/reviews' },
        { label: 'Sales Hub', icon: Users, href: '/admin/sales' },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { label: 'Revenue Desk', icon: FileText, href: '/admin/revenue' },
        { label: 'Payouts', icon: Wallet, href: '/admin/payouts' },
        { label: 'Expenses', icon: CreditCard, href: '/admin/expenses' },
      ],
    },
  ];

  // Filter nav groups based on role
  const filteredNavGroups = navGroups.map(group => {
    const allowedItems = group.items.filter(item => 
      rolePermissions[activeRole]?.includes('*') || rolePermissions[activeRole]?.includes(item.label)
    );
    return { ...group, items: allowedItems };
  }).filter(group => group.items.length > 0);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/akun');
    router.refresh();
  };

  return (
    <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="admin-sidebar-header">
        <img src="/favicon.ico" alt="DearAdore" className="admin-brand-icon" />
        <div className="admin-brand-text">
          <h4>DearAdore OS</h4>
          <p>Business Operations Platform</p>
        </div>
      </div>

      <div className="admin-sidebar-search">
        <Search size={14} />
        <input type="text" placeholder="Search..." />
        <span className="shortcut">⌘K</span>
      </div>

      <div className="admin-sidebar-navs">
        {filteredNavGroups.map((group) => (
          <div key={group.title} className="admin-nav-group">
            <span className="admin-nav-group-title">{group.title}</span>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="admin-sidebar-footer">
        <img 
          src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} 
          alt={displayName} 
          className="admin-avatar" 
        />
        <div className="admin-user-info" style={{ flex: 1, overflow: 'hidden' }}>
          <h5 style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayName}</h5>
          <span style={{
            fontSize: '0.65rem',
            padding: '0.15rem 0.4rem',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            marginTop: '0.2rem',
            background: '#F9FAFB',
            color: '#4F46E5',
            fontWeight: '600',
            display: 'inline-block',
            textTransform: 'uppercase'
          }}>
            {activeRole}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEE2E2'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={16} />
        </button>
      </div>

    </aside>
  );
}
