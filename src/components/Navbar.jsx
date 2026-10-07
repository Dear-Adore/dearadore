'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, LayoutGroup } from 'framer-motion';
import { LayoutGrid, ShoppingBag, User } from 'lucide-react';
import CreateButton from './CreateButton';

const navItems = [
  { label: 'Beranda', path: '/', icon: LayoutGrid },
  { label: 'Katalog', path: '/katalog', icon: ShoppingBag },
  { label: 'Akun', path: '/akun', icon: User },
];

const Navbar = ({ isPlaying, toggleMusic, theme, toggleTheme }) => {
  const pathname = usePathname();
  const navbarRef = useRef(null);

  // State koordinat lokal active pill
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, top: 0, height: 0, opacity: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getActiveItem = () => {
    return navItems.find((item) => {
      if (item.path === '/') {
        return pathname === '/' || pathname === '/beranda';
      }
      if (item.path === '/akun') { return pathname.startsWith('/akun'); } return pathname.startsWith(item.path);
    });
  };

  const activeItem = getActiveItem();
  const activePath = activeItem ? activeItem.path : null;

  // Mengukur posisi DOM active item secara independen dari scroll halaman
  useEffect(() => {
    const updatePill = () => {
      const activeEl = navbarRef.current?.querySelector('.nav-item.active');
      if (activeEl) {
        setPillStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1,
        });
      } else {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updatePill();

    // Loop pelacakan layout (30 frame) untuk sinkronisasi animasi text-width expansion di mobile
    let frameId;
    let count = 0;
    const tick = () => {
      updatePill();
      count++;
      if (count < 30) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    window.addEventListener('resize', updatePill);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePill);
    };
  }, [pathname, isMobile]);

  // Sembunyikan navbar global jika berada di halaman detail undangan atau form buat pesanan atau halaman admin/sales
  const isKatalogDetail = pathname?.startsWith('/katalog/') && pathname !== '/katalog';
  const isBuatUndangan = pathname === '/buat-undangan' || pathname?.startsWith('/buat-undangan');
  const isAdminPage = pathname?.startsWith('/admin');
  const isSalesPage = pathname?.startsWith('/sales');
  if (isKatalogDetail || isBuatUndangan || isAdminPage || isSalesPage) {
    return null;
  }

  return (
    <LayoutGroup>
      <div className="navbar-wrapper">
        {/* MAIN LIVING NAVBAR FLOATING ISLAND */}
        <motion.nav
          ref={navbarRef}
          className="navbar"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={
            isReady
              ? { type: "spring", stiffness: 260, damping: 25 }
              : { type: "tween", duration: 0 }
          }
        >
          {/* PERSISTENT ACTIVE PILL */}
          {pillStyle.opacity > 0 && (
            <motion.div
              className="active-pill"
              animate={{
                left: pillStyle.left,
                width: pillStyle.width,
                top: pillStyle.top,
                height: pillStyle.height,
              }}
              transition={
                isReady
                  ? { type: "spring", stiffness: 300, damping: 30 }
                  : { type: "tween", duration: 0 }
              }
              style={{
                position: 'absolute',
                opacity: pillStyle.opacity,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {navItems.map((item) => {
            const isCurrentActive =
              item.path === '/'
                ? pathname === '/' || pathname === '/beranda'
                : item.path === '/akun' ? pathname.startsWith('/akun') : pathname.startsWith(item.path);

            const IconComponent = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={isCurrentActive ? 'nav-item active' : 'nav-item'}
              >
                <motion.div
                  className="nav-item-content"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="nav-item-icon">
                    <IconComponent size={18} strokeWidth={2.2} />
                  </span>
                  <motion.span
                    className="nav-item-label"
                    animate={{
                      width: isMobile ? (isCurrentActive ? "auto" : 0) : "auto",
                      opacity: isMobile ? (isCurrentActive ? 1 : 0) : 1,
                      marginLeft: isMobile && !isCurrentActive ? 0 : 4,
                    }}
                    transition={
                      isReady
                        ? { type: "spring", stiffness: 300, damping: 30 }
                        : { type: "tween", duration: 0 }
                    }
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </motion.nav>

        {/* DE-ATTACHED FLOATING CREATE BUTTON */}
        <CreateButton />
      </div>
    </LayoutGroup>
  );
};

export default Navbar;


