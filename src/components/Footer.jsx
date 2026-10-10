'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on buat-undangan page
  if (pathname && pathname.startsWith('/buat-undangan')) {
    return null;
  }

  return (
    <footer style={{ padding: '2rem 1rem 6rem', textAlign: 'center', fontSize: '0.75rem', color: '#6B7280', letterSpacing: '0.05em' }}>
      <div>© {new Date().getFullYear()} DEAR ADORE | ALL RIGHT RESERVED</div>
      <div style={{ marginTop: '0.5rem' }}>Made with creativity by <a href="https://abibhaskara.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>abi bhaskara</a></div>
    </footer>
  );
}
