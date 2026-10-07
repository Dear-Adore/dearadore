'use client';
import { getProducts } from '../actions/adminActions';


import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Search,
  X,
  SlidersHorizontal,
  Check,
  Star,
  ShoppingBag,
  ArrowUpRight,
  MessageCircle,
  Eye,
  Tag,
  Palette,
  Scissors,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { categories, sortOptions, colorOptions } from '../../data/katalogData';
import { AdoreCache } from '../../lib/adoreCache';

export default function KatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedTier, setSelectedTier] = useState('Semua');
  const [sortBy, setSortBy] = useState('terpopuler');
  const [selectedColor, setSelectedColor] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const sortRef = useRef(null);

  const [dbProducts, setDbProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadProducts() {
      const res = await getProducts();
      if (res.success) {
        const active = res.data.filter(p => p.status === 'Aktif');
        const mapped = active.map(p => ({
          id: p.id,
          title: p.name,
          category: p.category,
          tier: p.category || 'Basic', // Tier is stored in category now
          basePrice: p.basePrice || 127000,
          price: p.price,
          date: p.createdAt,
          soldCount: 0, // Mock for now
          imageUrl: p.previewImage || 'https://via.placeholder.com/400x600',
          previewUrl: p.previewUrl || 'https://raden-amanda.dearadore.site',
          material: '',
          description: '',
          colors: p.colors || [],
          features: p.features || [],
          tags: p.tags || []
        }));
        setDbProducts(mapped);
      }
      setIsLoading(false);
    }
    loadProducts();
  }, []);

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  // Close sort popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format IDR currency
  const formatCurrency = (amount) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Count items per category (based on dbProducts)
  const categoryCounts = useMemo(() => {
    const counts = { Semua: dbProducts.length };
    categories.forEach((cat) => {
      if (cat !== 'Semua') {
        counts[cat] = dbProducts.filter((p) => p.tags && p.tags.includes(cat)).length;
      }
    });
    return counts;
  }, [dbProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...dbProducts];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
          (item.colors && item.colors.some(c => c.toLowerCase().includes(q)))
      );
    }

    // Category filter (Event types are stored in tags)
    if (selectedCategory !== 'Semua') {
      result = result.filter((item) => item.tags && item.tags.includes(selectedCategory));
    }
    
    // Tier filter (Tier is stored in category)
    if (selectedTier !== 'Semua') {
      result = result.filter((item) => item.tier === selectedTier);
    }

    // Color filter
    if (selectedColor) {
      const c = selectedColor.toLowerCase();
      result = result.filter((item) => {
        const itemColors = item.colors ? item.colors.map(color => color.toLowerCase()) : [];
        return itemColors.includes(c);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'terbaru') {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === 'harga_rendah') {
        return a.price - b.price;
      }
      if (sortBy === 'harga_tinggi') {
        return b.price - a.price;
      }
      if (sortBy === 'terpopuler') {
        return b.soldCount - a.soldCount;
      }
      if (sortBy === 'nama_az') {
        return a.title.localeCompare(b.title, 'id', { sensitivity: 'base' });
      }
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedTier, selectedColor, sortBy, dbProducts]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSelectedTier('Semua');
    setSortBy('terpopuler');
    setSelectedColor('');
    setVisibleCount(8);
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  const activeSortLabel = sortOptions.find((opt) => opt.key === sortBy)?.label || 'Urutkan';

  return (
    <div className="page-container katalog-page-container">
      {/* STICKY HEADER (SEARCH + CATEGORIES) */}
      <div className="katalog-sticky-header">
        {/* SEARCH BAR & SORT FILTER (PATTERNED AFTER UNTUKESOK.ID/PROGRAMS) */}
        <div className="katalog-search-row">
          {/* Search Input Bar */}
        <div className="katalog-search-input-wrap">
          <Search size={19} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input
            type="text"
            className="katalog-search-input"
            placeholder="Cari tema, warna, atau gaya undangan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(8);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="katalog-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              title="Hapus pencarian"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Circular Sort Popover Button */}
        <div className="katalog-sort-btn-wrapper" ref={sortRef}>
          <button
            type="button"
            className={`katalog-sort-btn ${isSortOpen || sortBy !== 'terpopuler' || selectedColor !== '' ? 'active' : ''}`}
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-label="Urutkan Koleksi"
            title="Urutkan Koleksi"
          >
            <SlidersHorizontal size={19} />
          </button>

          {/* Sort Dropdown Menu */}
          
            {isSortOpen && (
              <div
                className="katalog-sort-popover"
                
                
                
                
              >
                <div
                  style={{
                    padding: '0.4rem 0.75rem 0.5rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid rgba(158, 59, 59, 0.08)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Urutkan Berdasarkan
                </div>
                {sortOptions.map((option) => {
                  const isSelected = sortBy === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`katalog-sort-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSortBy(option.key);
                      }}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check size={16} color="var(--color-primary-dark)" />}
                    </button>
                  );
                })}

                <div
                  style={{
                    padding: '0.6rem 0.75rem 0.5rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                    marginTop: '0.5rem',
                  }}
                >
                  Berdasarkan Warna
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', padding: '0 0.75rem 0.5rem', flexWrap: 'wrap', maxWidth: '200px' }}>
                  {colorOptions.map((option) => {
                    const isSelected = selectedColor === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        title={option.label}
                        onClick={() => setSelectedColor(isSelected ? '' : option.key)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: option.hex,
                          border: isSelected ? '2px solid #111827' : '1px solid #E5E7EB',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 0 1px #FFFFFF inset' : 'none',
                          padding: 0,
                          flexShrink: 0
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          
        </div>
      </div>
      

      {/* HORIZONTAL SCROLLABLE CATEGORY PILLS */}
      <div className="katalog-categories-scroll">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                className={`katalog-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(8);
                }}
              >
                <span>{cat}</span>
                <span className="katalog-category-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* PRODUCTS GRID OR EMPTY STATE */}
      {isLoading ? (
        <div className="katalog-grid">
          <div style={{ height: '350px', borderRadius: '16px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ height: '350px', borderRadius: '16px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ height: '350px', borderRadius: '16px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <div style={{ height: '350px', borderRadius: '16px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: .5; }
            }
          `}} />
        </div>
      ) : filteredProducts.length === 0 ? (
        /* EMPTY STATE (ALA UNTUKESOK.ID) */
        <div
          className="glass-card empty-page-placeholder"
          
          
          
          style={{ marginTop: '1rem', padding: '3.5rem 1.5rem' }}
        >
          <div className="empty-icon-box">
            <ShoppingBag />
          </div>
          <h3 className="brand-title" style={{ fontSize: '1.4rem', color: 'var(--text-main)' }}>
            Tidak ada koleksi ditemukan
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '380px' }}>
            {searchQuery
              ? `Tidak ada hasil untuk kata kunci "${searchQuery}". Coba gunakan istilah lain atau bersihkan filter.`
              : 'Belum ada produk untuk kategori yang Anda pilih.'}
          </p>
          <button
            type="button"
            className="modal-action-btn primary"
            style={{ marginTop: '0.5rem', maxWidth: '200px' }}
            onClick={handleResetFilters}
          >
            <RotateCcw size={15} />
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          {/* CATALOG GRID */}
          <div
            className="katalog-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${selectedCategory}-${sortBy}-${searchQuery}`}
          >
            {filteredProducts.slice(0, visibleCount).map((product) => {
              return (
                <Link key={product.id} href={`/katalog/${generateSlug(product.title)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="katalog-card"
                  variants={itemVariants}
                >
                  {/* Image Wrap & Badges */}
                  <div className="katalog-card-image-wrap">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="katalog-card-image"
                      priority={false}
                    />
                    <div className="katalog-card-overlay" />
                    

                    {/* Floating Detail Button */}
                    <div className="katalog-card-footer" style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', borderTop: 'none', padding: 0, margin: 0, zIndex: 10, width: 'auto' }}>
                      <span 
                        className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center transition-transform hover:scale-105 hover:bg-red-900 shadow-md"
                        title="Lihat Detail"
                      >
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="katalog-card-content">
                    <h3 className="katalog-card-title">{product.title}</h3>

                    <div className="katalog-card-price-row">
                      <span className="katalog-card-price">{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>

          {/* LOAD MORE BUTTON (ALA UNTUKESOK.ID/PROGRAMS) */}
          {filteredProducts.length > visibleCount && (
            <div
              
              
              style={{ textAlign: 'center', marginTop: '2.5rem' }}
            >
              <button
                type="button"
                className="katalog-category-pill"
                onClick={() => setVisibleCount((prev) => prev + 8)}
                style={{
                  margin: '0 auto',
                  padding: '0.75rem 2rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 4px 16px rgba(158, 59, 59, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Muat Lebih Banyak</span>
                <span style={{ opacity: 0.75, fontSize: '0.8rem' }}>
                  ({filteredProducts.length - visibleCount} Koleksi Tersisa)
                </span>
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
