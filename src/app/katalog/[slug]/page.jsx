'use client';
import { getProducts } from '../../actions/adminActions';
import { toggleFavorite } from '../../actions/projectActions';


import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles, Eye, Clock, Check, Plus, Heart, Pencil, Share2 } from 'lucide-react';
import {
  DEFAULT_ESSENTIAL_FEATURES,
  DEFAULT_ADDITIONAL_FEATURES,
} from '../../../data/katalogData';
import { AdoreCache } from '../../../lib/adoreCache';

// Utility to generate slug
const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const formatCurrency = (val) => {
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export default function ProductDetail({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState({ essential: [...DEFAULT_ESSENTIAL_FEATURES], additional: [...DEFAULT_ADDITIONAL_FEATURES] });
  const [isLiked, setIsLiked] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const res = await getProducts();
      if (res.success) {
        const found = res.data.find(p => p.status === 'Aktif' && generateSlug(p.name) === params.slug);
        if (found) {
          const prodData = {
            id: found.id,
            title: found.name,
            category: found.category,
            price: found.price,
            imageUrl: found.previewImage || 'https://via.placeholder.com/400x600',
            videoUrl: found.videoUrl || null,
            previewUrl: found.previewUrl || 'https://raden-amanda.dearadore.site',
            waktuPengerjaan: '1 - 3 Hari Kerja'
          };
          let eFeat = [...DEFAULT_ESSENTIAL_FEATURES].filter(f => f !== 'Video'); // Start with static ones
          let aFeat = [...DEFAULT_ADDITIONAL_FEATURES];
          
          if (found.features && found.features.length > 0) {
            const dbEssential = found.features.filter(f => !DEFAULT_ADDITIONAL_FEATURES.includes(f) && f !== 'Amplop Digital');
            eFeat = Array.from(new Set([...eFeat, ...dbEssential]));
            aFeat = found.features.filter(f => DEFAULT_ADDITIONAL_FEATURES.includes(f) || f === 'Amplop Digital');
          }
          
          const featData = {
            essential: eFeat,
            additional: aFeat
          };
          
          console.log("DEBUG LOADED PRODUCT:", prodData);

          setProduct(prodData);
          setFeatures(featData);
        }
      }
      setLoading(false);
    }
    loadProduct();
  }, [params.slug]);

  useEffect(() => {
    if (!product) return;
    try {
      const storedStr = localStorage.getItem('dearadore_wishlist');
      if (storedStr) {
        const wl = JSON.parse(storedStr);
        if (wl.some((item) => item.themeId === params.slug)) {
          setIsLiked(true);
        }
      }
    } catch(e) {}
  }, [product, params.slug]);

  const handleLikeToggle = async () => {
    if (!product) return;
    try {
      // Optimistic update local storage
      const storedStr = localStorage.getItem('dearadore_wishlist');
      let wl = [];
      if (storedStr) {
        wl = JSON.parse(storedStr);
      }
      
      if (isLiked) {
        wl = wl.filter((item) => item.themeId !== params.slug);
        setIsLiked(false);
      } else {
        wl.push({
          id: `FAV-${product.id}`,
          title: product.title,
          theme: product.category || 'Theme',
          themeCategory: product.category || 'Katalog',
          themeId: params.slug,
          eventDate: 'Belum diatur',
          eventVenue: '',
          createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        });
        setIsLiked(true);
      }
      localStorage.setItem('dearadore_wishlist', JSON.stringify(wl));

      // Import the action dynamically and call it to update the db if user is logged in

      await toggleFavorite(product.id);

    } catch(e) {
      console.error(e);
    }
  };
  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '7rem', background: '#FFFFFF', minHeight: '100vh' }}>
        {/* Skeleton Top Navigation */}
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ width: '120px', height: '20px', borderRadius: '4px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        </div>

        <div className="katalog-detail-layout">
          {/* Skeleton Mockup */}
          <div className="katalog-detail-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '360px', height: '720px', borderRadius: '40px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>

          {/* Skeleton Content */}
          <div className="katalog-detail-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ width: '60%', height: '32px', borderRadius: '6px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginTop: '0.4rem' }} />
            <div style={{ width: '30%', height: '28px', borderRadius: '6px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            
            <div style={{ height: '200px', borderRadius: '12px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div style={{ height: '180px', borderRadius: '12px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        </div>

        {/* CSS for pulse animation if not globally defined */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}} />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '7rem', background: '#FFFFFF', minHeight: '100vh' }}>

      {/* Top Navigation */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/katalog" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            color: 'var(--text-main)',
            textDecoration: 'none'
          }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
            Detail Undangan
          </span>
        </div>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: product.name,
                text: 'Lihat tema undangan ini di Dear Adore',
                url: window.location.href,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Link berhasil disalin!');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            color: 'var(--text-main)',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Bagikan"
        >
          <Share2 size={18} />
        </button>
        
      </div>

      <div className="katalog-detail-layout">

        {/* Device Mockup Wrapper for Web Invitation Thumbnail */}
        <div className="katalog-detail-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="phone-png-frame-container" style={{ filter: 'none', margin: '0 auto' }}>
            <div className="phone-screen-scroll" style={{ overflow: 'hidden' }}>
              {product.videoUrl && !videoError ? (
                <video
                  src={product.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setVideoError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'bottom', transform: 'scale(1)' }}
                />
              ) : (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: 'cover', objectPosition: 'bottom', transform: 'scale(1)' }}
                  priority
                />
              )}
            </div>

            {/* OVERLAID TRANSPARENT IPHONE PNG FRAME */}
            <div className="phone-png-overlay">
              <Image
                src="/mock-ip.png"
                alt="Phone Frame"
                fill
                sizes="360px"
                className="phone-png-img"
                priority
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="katalog-detail-content">
          <div>

            <h1
              className="brand-title"
              style={{
                fontSize: 'clamp(1.35rem, 5vw, 1.75rem)',
                marginTop: '0.4rem',
                color: 'var(--text-main)',
                lineHeight: 1.2
              }}
            >
              {product.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: 'clamp(1.25rem, 4vw, 1.6rem)',
                fontWeight: 700,
                color: 'var(--color-primary-dark)',
              }}
            >
              {formatCurrency(product.price)}
            </span>

          </div>

          {/* FITUR ESENSIAL & FITUR TAMBAHAN */}
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Fitur Esensial */}
            <div
              style={{
                background: '#FAFAFA',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '12px',
                padding: '1rem 1.15rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-main)',
                  }}
                >
                  Fitur Esensial
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.55rem' }}>
                {features.essential.map((fitur, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <Check size={15} color="var(--color-primary)" strokeWidth={2.5} />
                    <span>{fitur}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fitur Tambahan (Addition) */}
            {features.additional && features.additional.length > 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  padding: '1rem 1.15rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-main)',
                    }}
                  >
                    Fitur Tambahan
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.55rem' }}>
                  {features.additional.map((fitur, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Check size={15} color="#9CA3AF" strokeWidth={2.2} />
                      <span>{fitur}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Spec Box */}
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              fontSize: '0.9rem',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              padding: '1.25rem 0',
            }}
          >

            {/* Turnaround */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.4rem', background: 'var(--color-primary-light)', borderRadius: '8px', color: '#fff' }}>
                <Clock size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Waktu Pengerjaan</span>
                <span style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{product.waktuPengerjaan || '1 - 3 Hari Kerja'}</span>
              </div>
            </div>
          </div>



        </div>
      </div>

      {/* Floating Bottom Action Navbar (Buat Sekarang & Preview) */}
      <div className="detail-navbar-wrapper">
        <div className="detail-navbar">
          <Link
            href={`/buat-undangan?theme=${product.id}`}
            className="detail-nav-btn primary"
          >
            <Pencil size={16} />
            <span>Buat</span>
          </Link>
          <button
            onClick={handleLikeToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #E5E7EB',
              color: isLiked ? '#EF4444' : 'var(--text-main)',
              cursor: 'pointer',
              transition: '0.2s',
              flexShrink: 0
            }}
          >
            <Heart size={18} fill={isLiked ? '#EF4444' : 'none'} />
          </button>
          <a
            href={product.previewUrl || 'https://raden-amanda.dearadore.site'}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-nav-btn secondary"
          >
            <Eye size={16} />
            <span>Lihat</span>
          </a>
        </div>
      </div>
    </div>
  );
}
