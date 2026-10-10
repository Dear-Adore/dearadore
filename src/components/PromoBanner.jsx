'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';

export default function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateCountdown = () => {
      const now = new Date();
      let target = new Date();
      target.setHours(22, 0, 0, 0); // 10 PM today

      if (now.getTime() > target.getTime()) {
        // If it's past 10 PM, target is 10 PM tomorrow
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}j ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}d`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 55%, var(--color-primary-dark) 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '2rem',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Background */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1, pointerEvents: 'none' }}>
        <Tag size={120} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem', lineHeight: 1.3 }}>
            KLAIM KODE PROMO MEMBER BARU DISCOUNT 20%
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
            *Syarat & ketentuan: daftar akun dan melakukan pembelian sebanyak 1 kali, berlaku untuk semua paket.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#111827', color: '#FFF', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {timeLeft}
            </div>
          </div>
          
          <Link 
            href="/akun?claimPromo=DEARADORE"
            style={{
              background: '#FFFFFF',
              color: '#D97706',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'inline-block',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.1s ease-in-out',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            KLAIM SEKARANG
          </Link>
        </div>
      </div>
    </div>
  );
}
