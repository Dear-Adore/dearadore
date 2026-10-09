'use client';
import { getUserOrders } from '../actions/orderActions';
import { getUserFavorites, getUserDrafts } from '../actions/projectActions';
import { getProducts } from '../actions/adminActions';
import { syncUserToDatabase } from '../actions/userActions';


import { useState, useEffect } from 'react';
import Link from 'next/link';

import {
  PenLine,
  Eye,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  Calendar,
  Share2,
  X,
  CreditCard,
  ShoppingBag,
  Info,
  Music,
  Palette,
  Video,
  QrCode,
  Utensils,
  MapPin,
  CheckCircle2,
  Clock,
  Timer,
  Zap,
  LogOut,
  Download,
  Users
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, updateProfile, updatePassword, signOut } from 'firebase/auth';
import LoginView from '../../components/LoginView';
import { AdoreCache } from '../../lib/adoreCache';

const statusTabs = [
  { id: 'selesai', label: 'Pesanan' },
  { id: 'ditunda', label: 'Ditunda' },
  { id: 'favorit', label: 'Favorit' },
];

const defaultProjects = {
  ditunda: [],
  proses: [],
  favorit: [],
  selesai: [],
};

export default function AkunPage() {
  const [activeTab, setActiveTab] = useState('selesai');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [allProjects, setAllProjects] = useState(defaultProjects);
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  // Load saved profile & orders from DB
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await new Promise(resolve => {
           const unsubscribe = onAuthStateChanged(auth, u => {
             unsubscribe();
             resolve(u);
           });
        });

        if (user) {
          setUserName(user.displayName || user.email.split('@')[0]);
          setUserEmail(user.email);
          setUserPhone('');
          setUserAvatar(user.photoURL || '');
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setIsLoading(false);
          return;
        }

        // --- SWR CACHE CHECK ---
        const CACHE_KEY = `akun_data_${user.id}`;
        const cachedData = AdoreCache.get(CACHE_KEY);
        if (cachedData) {
          setAllProjects(cachedData);
          setIsLoading(false); // Render instantly with cached data
        }





        const [ordersRes, draftsRes, favsRes, productsRes] = await Promise.all([
          getUserOrders(),
          getUserDrafts(),
          getUserFavorites(),
          getProducts(),
        ]);
        
        let dynamicProses = [];
        let dynamicSelesai = [];
        let dynamicDitunda = [];
        let dynamicFavorit = [];

        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          ordersRes.data.forEach((o) => {
            const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hari ini';
            const pkg = o.packageData || {};
            const personName = pkg.eventName || pkg.birthdayPersonName || (pkg.groomName ? `${pkg.groomName} & ${pkg.brideName}` : o.clientName || 'Nama Pemesan');
            const ageInfo = pkg.birthdayAge ? ` (${pkg.birthdayAge})` : '';
            const slug = personName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

            const eventType = o.eventType || pkg.eventType || 'Acara';
            
            let evDateStr = 'Belum diatur';
            const rawDate = pkg.eventDate || o.eventDate;
            if (rawDate) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                evDateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
              }
            }

            const projectObj = {
              id: o.id,
              title: `${eventType} ${personName}${ageInfo}`.trim(),
              theme: o.themeTitle || 'Tema Pilihan',
              themeCategory: o.themeCategory || 'Collection',
              createdAt: dateStr,
              eventDate: evDateStr,
              eventTime: pkg.eventTime || o.eventTime || '18:30 WIB',
              eventVenue: pkg.eventVenue || o.eventVenue || 'Tempat / Venue',
              previewUrl: pkg.previewUrl || `https://${slug}.dearadore.site`,
              rsvpUrl: pkg.rsvpUrl || '#',
              deadlineDays: pkg.deadlineDays || 3,
              packageName: o.package?.name || pkg.package?.name || 'Paket Utama',
              price: Number(o.package?.price || pkg.package?.price || o.totalPrice || 0),
              statusNote: `Paket ${o.package?.name || pkg.package?.name || 'Utama'} • Rp ${Number(o.totalPrice || 0).toLocaleString('id-ID')}`,
              orderStatus: (o.status || 'proses').toLowerCase(),
              rawOrder: o,
            };

            if (projectObj.orderStatus === 'selesai' || projectObj.orderStatus === 'completed') {
              dynamicSelesai.push(projectObj);
            } else if (projectObj.orderStatus === 'ditunda') {
              dynamicDitunda.push({
                id: o.id,
                themeId: o.themeId,
                title: `Draft: ${o.clientName || 'Undangan Baru'}`,
                theme: o.themeName,
                createdAt: projectObj.createdAt,
                eventDate: projectObj.eventDate,
                eventVenue: projectObj.eventVenue,
                rawOrder: o.packageData || o // pass packageData so handleContinueDraft works
              });
            } else {
              dynamicProses.push(projectObj);
            }
          });
        }

        if (draftsRes.success && Array.isArray(draftsRes.data)) {
          draftsRes.data.forEach(d => {
            const draftPayload = d.formData || {};
            const actualFormData = draftPayload.formData || {};
            const dateStr = d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hari ini';
            
            const draftPersonName = actualFormData.eventName || actualFormData.birthdayPersonName || (actualFormData.groomName ? `${actualFormData.groomName} & ${actualFormData.brideName}` : draftPayload.clientName || 'Undangan Baru');
            
            let draftDateStr = 'Belum diatur';
            const rawDraftDate = actualFormData.eventDate || draftPayload.eventDate;
            if (rawDraftDate) {
              const dDate = new Date(rawDraftDate);
              if (!isNaN(dDate.getTime())) {
                draftDateStr = dDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
              }
            }

            dynamicDitunda.push({
              id: d.id,
              themeId: d.themeId,
              title: `Draft: ${draftPersonName}`.trim(),
              theme: d.themeName,
              createdAt: dateStr,
              eventDate: draftDateStr,
              eventVenue: actualFormData.eventVenue || draftPayload.eventVenue || 'Tempat / Venue',
              rawOrder: { ...draftPayload, themeId: d.themeId }
            });
          });
        }

        if (favsRes.success && Array.isArray(favsRes.data) && productsRes.success) {
          favsRes.data.forEach(f => {
            const prod = productsRes.data.find(p => p.id === f.productId);
            if (prod) {
              const dateStr = f.createdAt ? new Date(f.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hari ini';
              dynamicFavorit.push({
                id: f.id,
                themeId: prod.id,
                title: prod.name,
                theme: prod.category,
                createdAt: dateStr,
                eventDate: 'Belum diatur',
                eventVenue: '',
                previewUrl: prod.previewImage || 'https://via.placeholder.com/400x600',
              });
            }
          });
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        const sortedPesanan = [...dynamicProses, ...dynamicSelesai].sort((a, b) => {
          const aIsProses = a.orderStatus !== 'selesai' && a.orderStatus !== 'completed';
          const bIsProses = b.orderStatus !== 'selesai' && b.orderStatus !== 'completed';
          
          if (aIsProses && !bIsProses) return -1;
          if (!aIsProses && bIsProses) return 1;

          if (aIsProses && bIsProses) {
             const dateA = a.rawOrder?.createdAt ? new Date(a.rawOrder.createdAt) : new Date(0);
             const dateB = b.rawOrder?.createdAt ? new Date(b.rawOrder.createdAt) : new Date(0);
             return dateB - dateA;
          }

          const evA = a.rawOrder?.eventDate ? new Date(a.rawOrder.eventDate) : new Date(0);
          const evB = b.rawOrder?.eventDate ? new Date(b.rawOrder.eventDate) : new Date(0);
          
          const aIsPast = evA < today;
          const bIsPast = evB < today;

          if (!aIsPast && bIsPast) return -1;
          if (aIsPast && !bIsPast) return 1;

          if (!aIsPast && !bIsPast) return evA - evB;
          return evB - evA;
        });

        const newProjects = {
          ditunda: dynamicDitunda,
          selesai: sortedPesanan,
          favorit: dynamicFavorit,
        };
        
        setAllProjects(newProjects);
        AdoreCache.set(`akun_data_${user.id}`, newProjects, 1000 * 60 * 5); // Cache for 5 mins

      } catch (e) {
        console.error('Error loading orders in AkunPage:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const currentProjects = allProjects[activeTab] || [];

  const totalActiveCount = (allProjects.selesai || []).filter(p => p.orderStatus === 'proses').length;
  const totalAllCount =
    (allProjects.ditunda || []).length +
    (allProjects.selesai || []).length;

  const handleCopyLink = (projectId, url) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleContinueDraft = (project) => {
    if (!project || !project.rawOrder) return;
    try {
      const raw = project.rawOrder || {};
      let draftPayload;

      if (raw.rawDraftData) {
        draftPayload = { id: project.id, ...raw.rawDraftData };
      } else if (raw.formData) {
        draftPayload = { id: project.id, ...raw };
      } else {
        draftPayload = {
          id: project.id,
          formData: {
            eventName: raw.eventName || '',
            eventType: raw.eventType || '',
            quotesMessage: raw.quotesMessage || '',
            eventDate: raw.eventDate || '',
            eventTime: raw.eventTime || '',
            eventVenue: raw.eventVenue || '',
            eventAddress: raw.eventAddress || '',
            eventMapsUrl: raw.eventMapsUrl || '',
            dresscodeText: raw.dresscodeText || '',
            videoUrl: raw.videoUrl || '',
            ...raw,
          },
          eventHosts: raw.eventHosts || (raw.birthdayPersonName ? raw.birthdayPersonName.split(' & ') : []),
          selectedEventTag: raw.selectedEventTag || (raw.eventType === 'Birthday' ? 'Birthday' : 'Wedding'),
          additionalFeatures: raw.additionalFeatures || {},
          selectedPackage: raw.selectedPackage || raw.package?.id || 'gold',
          paymentMethod: raw.paymentMethod?.id || 'qris',
          savedAt: new Date().toISOString(),
        };
      }
      
      localStorage.setItem('dearadore_order_draft', JSON.stringify(draftPayload));
      window.location.href = `/buat-undangan?theme=${raw.themeId || 'theme-01'}&stage=3`;
    } catch (err) {
      console.error('Error continuing draft:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const finalName = tempName.trim() || 'Amanda Clarissa';
    const finalEmail = tempEmail.trim() || 'amanda.clarissa@gmail.com';
    let finalPhone = tempPhone.trim();
    if (finalPhone && !finalPhone.startsWith('+62')) {
      if (finalPhone.startsWith('0')) finalPhone = '+62' + finalPhone.slice(1);
      else finalPhone = '+62' + finalPhone;
    }
    
    setUserName(finalName);
    setUserEmail(finalEmail);
    setUserPhone(finalPhone);
    try {
      const user = auth.currentUser;
      
      if (user) {
        // Update auth user
        await updateProfile(user, { displayName: finalName });
        if (tempPassword) {
           await updatePassword(user, tempPassword);
        }
        
        // Update public.users

        await syncUserToDatabase({
          id: user.id,
          email: finalEmail,
          name: finalName,
          phone: finalPhone,
          password: tempPassword || undefined
        });
      }
      localStorage.setItem('dearadore_user_profile', JSON.stringify({ name: finalName, email: finalEmail }));
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
    setIsEditProfileOpen(false);
  };

  if (isLoading) {
    return (
      <div className="account-page-wrapper">
        <div className="account-page-container">
          {/* Skeleton Profile Card */}
          <section className="account-profile-card">
            <div className="account-identity-box">
              <div className="account-avatar-wrapper">
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
              <div className="account-user-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div style={{ width: '150px', height: '24px', borderRadius: '4px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ width: '200px', height: '16px', borderRadius: '4px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
            </div>
          </section>

          {/* Skeleton Tabs */}
          <div className="account-section-header" style={{ marginTop: '2rem' }}>
            <div className="account-status-tabs-bar">
              <div style={{ width: '100px', height: '36px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ width: '100px', height: '36px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ width: '100px', height: '36px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
          </div>

          {/* Skeleton Grid */}
          <section className="account-projects-grid">
             <div style={{ height: '250px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
             <div style={{ height: '250px', borderRadius: '20px', background: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </section>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}} />
      </div>
    );
  }

  if (!isLoggedIn) { return <LoginView />; }

  return (
    <div className="account-page-wrapper">
      <div
        className="account-page-container"
        
        
        
        
      >
        {/* 1. TOP PROFILE HERO SECTION (RESPONSIVE FOR MOBILE & DESKTOP) */}
        <section className="account-profile-card">
          {/* User Identity Box */}
          <div className="account-identity-box">
            <div className="account-avatar-wrapper">
              <div className="account-avatar-circle" style={{ overflow: 'hidden' }}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>

            {/* EDIT BADGE WITH PEN ICON */}
            <button
              type="button"
              className="account-avatar-edit-badge"
              onClick={() => {
                setTempName(userName);
                setTempEmail(userEmail);
                setIsEditProfileOpen(true);
              }}
              aria-label="Edit Profil"
              title="Edit Nama & Email"
            >
              <PenLine size={15} />
            </button>
          </div>

          <div className="account-user-meta">
            <h1 className="account-user-name">{userName}</h1>
            <p className="account-user-email">{userEmail}</p>
          </div>
        </div>




      </section>

      {/* 2. SECTION HEADER & SEGMENTED STATUS PILL BAR */}
      <div className="account-section-header">

        <div className="account-status-tabs-bar" role="tablist">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = (allProjects[tab.id] || []).length;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                className={`account-status-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '0.75rem', opacity: isActive ? 1 : 0.75, fontWeight: 700 }}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PROJECT CARDS RESPONSIVE GRID */}
      <section>
        
          <div
            key={activeTab}
            
            
            
            
            className="account-projects-grid"
          >
            {currentProjects.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#111827',
                  border: '1.5px dashed #D1D5DB',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#111827' }}>
                  Belum Ada Undangan
                </p>
                <p style={{ fontSize: '0.88rem', color: '#6B7280', margin: '0 0 1.25rem' }}>
                  Tidak ada undangan dalam status {statusTabs.find((t) => t.id === activeTab)?.label}.
                </p>
                <Link
                  href="/katalog"
                  className="account-action-pill primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.65rem 1.4rem' }}
                >
                  <Plus size={15} />
                  <span>Pilih Tema di Katalog</span>
                </Link>
              </div>
            ) : (
              currentProjects.map((project) => (
                <div key={project.id} className="account-project-card">
                  <div style={{ minWidth: 0 }}>
                    {/* Card Header */}
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>ID:</span> {project.id}
                    </div>

                    {/* Title */}
                    <h3 className="account-card-title" title={project.title}>
                      {project.title}
                    </h3>

                    {/* Meta info: Date & Venue */}
                    <div className="account-card-meta">
                      <div className="account-meta-item">
                        <Calendar size={14} color="#6B7280" style={{ flexShrink: 0 }} />
                        <span>{project.eventDate || 'Jadwal Acara'}</span>
                      </div>
                      {project.eventVenue && (
                        <div className="account-meta-item">
                          <MapPin size={14} color="#6B7280" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.eventVenue}
                          </span>
                        </div>
                      )}
                    </div>


                  </div>

                  {/* ACTION BUTTONS (Optimized for Mobile 2-Row / Desktop 1-Row) */}
                  <div className="account-card-actions">
                    {activeTab === 'favorit' ? (
                      <Link
                        href={`/katalog/${project.themeId || 'theme-01'}`}
                        className="account-action-pill primary"
                        style={{ width: '100%', textDecoration: 'none', justifyContent: 'center' }}
                      >
                        <span>Lihat Tema</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    ) : activeTab === 'ditunda' ? (
                      <button
                        type="button"
                        className="account-action-pill primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem' }}
                        onClick={() => handleContinueDraft(project)}
                      >
                        <span>Lanjutkan</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ) : activeTab === 'selesai' && project.orderStatus !== 'selesai' && project.orderStatus !== 'completed' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                        <button
                          type="button"
                          className="account-action-pill"
                          style={{ background: '#F3F4F6', color: '#374151', cursor: 'default', border: '1px solid #E5E7EB', width: '100%' }}
                        >
                          <Timer size={14} />
                          <span>Selesai dalam {project.deadlineDays || 3} Hari</span>
                        </button>
                        <button
                          type="button"
                          className="account-action-pill primary"
                          style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#FFFFFF', width: '100%' }}
                          onClick={() => alert('Fitur Prioritaskan Antrean (Tonton Iklan) akan segera hadir!')}
                        >
                          <Zap size={14} />
                          <span>Prioritaskan (Tonton Iklan)</span>
                        </button>
                      </div>
                    ) : activeTab === 'selesai' ? (
                      <>
                        <a
                          href={project.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="account-action-pill primary"
                          title="Buka Preview Live Undangan"
                        >
                          <Eye size={13} />
                          <span>Preview Live</span>
                          <ArrowUpRight size={11} />
                        </a>

                        <div className="account-action-subrow">
                          <button
                            type="button"
                            className="account-action-pill"
                            onClick={() => handleCopyLink(project.id, project.previewUrl)}
                            title="Salin Tautan Undangan"
                          >
                            {copiedId === project.id ? (
                              <>
                                <Check size={13} color="#059669" />
                                <span style={{ color: '#059669' }}>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Salin</span>
                              </>
                            )}
                          </button>

                          <a
                            href={project.rsvpUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="account-action-pill"
                            title="Buka Data RSVP"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Users size={13} />
                            <span>RSVP</span>
                          </a>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        
      </section>

      {/* DETAIL MODAL FOR ORDER IN AKUN */}
      
        {selectedDetailProject && (
          <div className="modal-backdrop" onClick={() => setSelectedDetailProject(null)}>
            <div
              className="katalog-modal-dialog"
              style={{ maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto', padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
              onClick={(e) => e.stopPropagation()}
              
              
              
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>
                    {selectedDetailProject.id}
                  </span>
                  <h3 className="brand-title" style={{ fontSize: '1.3rem', color: '#111827', margin: 0 }}>
                    Rincian Undangan Birthday
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedDetailProject(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.825rem' }}>
                <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '1rem', border: '1px solid #E5E7EB' }}>
                  <strong style={{ display: 'block', color: '#111827', marginBottom: '0.2rem' }}>
                    {selectedDetailProject.title}
                  </strong>
                  <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)' }}>
                    "{selectedDetailProject.quotesMessage || 'Ayo rayakan momen spesial ini bersama!'}"
                  </p>
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '1rem', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Jadwal Acara:</span>
                    <strong style={{ color: '#111827' }}>{selectedDetailProject.eventDate} ({selectedDetailProject.eventTime || '18:30 WIB'})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tempat / Venue:</span>
                    <strong style={{ color: '#111827' }}>{selectedDetailProject.eventVenue}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Paket Layanan:</span>
                    <strong style={{ color: '#111827' }}>{selectedDetailProject.packageName}</strong>
                  </div>
                </div>

                {selectedDetailProject.dresscodeText && (
                  <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '1rem', border: '1px solid #E5E7EB' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Rekomendasi Dresscode:
                    </span>
                    <strong style={{ color: '#111827' }}>{selectedDetailProject.dresscodeText}</strong>
                    {selectedDetailProject.dresscodeColors && selectedDetailProject.dresscodeColors.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        {selectedDetailProject.dresscodeColors.map((c, i) => (
                          <span
                            key={c.id || i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#fff',
                              borderRadius: '20px',
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.hex }} />
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={selectedDetailProject.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-action-btn primary"
                    style={{ textDecoration: 'none', textAlign: 'center', flex: 1, padding: '0.75rem' }}
                  >
                    <Eye size={15} />
                    <span>Buka Preview Live</span>
                  </a>
                  <button
                    type="button"
                    className="modal-action-btn secondary"
                    onClick={() => handleCopyLink(selectedDetailProject.id, selectedDetailProject.previewUrl)}
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    <Copy size={15} />
                    <span>{copiedId === selectedDetailProject.id ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="modal-action-btn"
                    onClick={() => alert('Fitur unduh invoice PDF sedang dalam pengembangan.')}
                    style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', flex: 1, padding: '0.75rem', justifyContent: 'center' }}
                  >
                    <Download size={15} />
                    <span>Unduh Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      

      {/* EDIT PROFILE MODAL */}
      
        {isEditProfileOpen && (
          <div className="modal-backdrop" onClick={() => setIsEditProfileOpen(false)}>
            <div
              className="katalog-modal-dialog"
              style={{ maxWidth: '440px', padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
              onClick={(e) => e.stopPropagation()}
              
              
              
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 className="brand-title" style={{ fontSize: '1.25rem', color: '#111827' }}>
                  Edit Informasi Profil
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsEditProfileOpen(false)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#111827' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="katalog-search-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.85rem' }}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Contoh: Amanda Clarissa"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#111827' }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    className="katalog-search-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.85rem' }}
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="Contoh: amanda.clarissa@gmail.com"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#111827' }}>
                    Nomor WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    className="katalog-search-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.85rem' }}
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="Contoh: +6281234567890"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.35rem', color: '#111827' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="katalog-search-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '0.65rem 0.85rem' }}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #111827',
                    background: '#111827',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    marginTop: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Simpan</span>
                </button>
                
                <button
                  type="button"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#EF4444',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    marginTop: '1rem',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    if(confirm('Apakah Anda yakin ingin keluar?')) {
                      await signOut(auth);
                      document.cookie = 'firebase_uid=; path=/; max-age=0';
                      window.location.href = '/akun';
                    }
                  }}
                >
                  <LogOut size={15} />
                  <span>Keluar dari Akun</span>
                </button>
              </form>
            </div>
          </div>
        )}
      
    </div>
  </div>
  );
}
