'use client';

import React, { useState, useEffect } from 'react';
import { getProducts } from '../app/actions/adminActions';

export default function ProjectThumbnail({ project, activeTab }) {
  const [ogImage, setOgImage] = useState(null);
  const [catalogImage, setCatalogImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'selesai' && project.previewUrl) {
      setLoading(true);
      fetch(`/api/og?url=${encodeURIComponent(project.previewUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (data.ogImage) setOgImage(data.ogImage);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else if (activeTab === 'favorit' || activeTab === 'ditunda') {
      const themeId = project.themeId;
      if (themeId) {
        setLoading(true);
        getProducts().then(res => {
          if (res.success) {
            const product = res.data.find(p => p.id === themeId);
            if (product && product.previewImage) {
              setCatalogImage(product.previewImage);
            }
          }
        }).catch(err => console.error(err))
        .finally(() => setLoading(false));
      }
    }
  }, [activeTab, project.previewUrl, project.themeId]);

  let imageUrl = null;
  if (activeTab === 'selesai') {
    imageUrl = ogImage; // will fall back to placeholder if null
  } else {
    imageUrl = catalogImage; // will fall back to placeholder if null
  }

  return (
    <div style={{
      width: '100%',
      aspectRatio: '3/4',
      backgroundColor: '#F3F4F6',
      borderRadius: '16px',
      marginBottom: '1rem',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 500 }}>
          <span className="spinner" style={{ marginRight: '8px', width: '16px', height: '16px', border: '2px solid #D1D5DB', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Memuat...
        </div>
      ) : imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Thumbnail" 
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { 
            e.target.style.display = 'none';
          }} 
        />
      ) : null}
    </div>
  );
}
