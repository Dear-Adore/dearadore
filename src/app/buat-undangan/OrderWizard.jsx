'use client';
import { getProducts } from '../actions/adminActions';
import { validatePromoCode } from '../actions/projectActions';
import { createOrder, deleteOrder } from '../actions/orderActions';


import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  X,
  CreditCard,
  QrCode,
  Building,
  UploadCloud,
  ArrowUpRight,
  Save,
  Tag,
} from 'lucide-react';
import { saveDraft, deleteDraft } from '../actions/projectActions';
import { calculateOrderPricing } from '../../lib/pricingEngine';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { DEFAULT_ESSENTIAL_FEATURES } from '../../data/katalogData';

const presetColors = [
  { name: 'Merah', hex: '#EF4444' },
  { name: 'Jingga', hex: '#F97316' },
  { name: 'Kuning', hex: '#EAB308' },
  { name: 'Hijau', hex: '#22C55E' },
  { name: 'Biru', hex: '#3B82F6' },
  { name: 'Nila', hex: '#4F46E5' },
  { name: 'Ungu', hex: '#A855F7' },
];

const eventTags = ['Pernikahan', 'Ulang Tahun', 'Lamaran', 'Syukuran', 'Anniversary', 'Kustom'];

const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function OrderWizardContent({ salesMode = false }) {
  const DRAFT_KEY = salesMode ? 'dearadore_sales_draft' : 'dearadore_order_draft';
  const homePath = salesMode ? '/sales' : '/akun';
  const searchParams = useSearchParams();
  const router = useRouter();
  const themeId = searchParams.get('theme');

  const [selectedTheme, setSelectedTheme] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  
  const [activeThemeId, setActiveThemeId] = useState(themeId);
  const [showThemeSearchModal, setShowThemeSearchModal] = useState(false);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');

  useEffect(() => {
    async function fetchTheme() {
      try {
        const res = await getProducts();
        if (res.success) {
          setAllProducts(res.data);
          if (activeThemeId) {
            const found = res.data.find(p => p.id === activeThemeId);
            if (found) {
              setSelectedTheme({
                id: found.id,
                name: found.name,
                category: found.category,
                basePrice: found.price,
                essentialFeatures: found.features || DEFAULT_ESSENTIAL_FEATURES
              });
              setCmsEssentialFeatures(found.features || DEFAULT_ESSENTIAL_FEATURES);
            }
          }
        }
      } catch (err) {}
      setDbLoading(false);
    }
    fetchTheme();
  }, [activeThemeId]);

  const [currentStage, setCurrentStage] = useState(searchParams.get('stage') ? parseInt(searchParams.get('stage'), 10) : 1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSavedNotification, setIsSavedNotification] = useState(false);

  // Fitur Esensial Dinamis dikontrol oleh DB
  const [cmsEssentialFeatures, setCmsEssentialFeatures] = useState([...DEFAULT_ESSENTIAL_FEATURES]);


  const isCountdownEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('countdown timer'));
  const isDressCodeEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('dress code'));
  const isGalleryEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('gallery') || f.toLowerCase().includes('galeri foto'));
  const isAmplopDigitalEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('amplop digital'));
  const isMenuSelectionEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('menu selection'));
  const isLiveStreamingEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('live streaming'));
  const isQrCheckinEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('qr code check-in') || f.toLowerCase().includes('qr checkin'));
  const isVideoEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('video'));
  const isCustomDomainEnabled = cmsEssentialFeatures.some(f => f.toLowerCase().includes('custom domain'));


  const goToStage = (st) => {
    setCurrentStage(st);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // State: Acara & Pemilik Acara
  const [eventHosts, setEventHosts] = useState(['']);
  const [selectedEventTag, setSelectedEventTag] = useState('Ulang Tahun');

  // State: Waktu / Jam Scrollable
  const [eventHour, setEventHour] = useState('18');
  const [eventMinute, setEventMinute] = useState('30');
  const [eventTimezone, setEventTimezone] = useState('WIB');
  const [isUntilDone, setIsUntilDone] = useState(true);
  const [eventEndHour, setEventEndHour] = useState('21');
  const [eventEndMinute, setEventEndMinute] = useState('00');
  const [orderId, setOrderId] = useState(null);

  // State: Form Data Utama
  const [formData, setFormData] = useState({
    // 1. Acara
    eventName: '',
    eventType: 'Ulang Tahun',
    birthdayPersonName: '',

    // Kontak Client
    contactName: '',
    contactPhone: '',

    // 2. Pesan Undangan
    guestGreetingFormat: 'Kepada Yth. Bapak/Ibu/Saudara/i [Nama Tamu]',
    quotesMessage: '',

    // 3. Detail Acara
    eventDate: '',
    eventTime: '18:30 WIB - Selesai',
    eventVenue: '',
    eventAddress: '',
    eventMapsUrl: '',

    // Fitur Tambahan (Addition)
    countdownTitle: 'Menuju Hari Acara',
    countdownTargetDate: '',

    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',
    giftPhysicalAddress: '',
    additionalButtons: [],

    dresscodeText: '',

    rsvpAllowPlusOne: false,
    rsvpMaxPlusOne: 1,
    rsvpMenuOptions: '',
    menuMakananEnabled: true,
    menuMakananOptions: '',
    menuMinumanEnabled: true,
    menuMinumanOptions: '',
    menuBeverageEnabled: true,
    menuBeverageOptions: '',
    rsvpAskDietary: false,
    rsvpAskGuestCount: false,

    liveStreamingPlatform: 'YouTube Live',
    liveStreamingUrl: '',
    liveStreamingTime: '',

    // Fitur Esensial: Video
    videoUrl: '',
  });

  // Sinkronisasi otomatis waktu/jam ke formData.eventTime
  useEffect(() => {
    if (isUntilDone) {
      setFormData((prev) => ({
        ...prev,
        eventTime: `${eventHour}:${eventMinute} ${eventTimezone} - Selesai`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        eventTime: `${eventHour}:${eventMinute} - ${eventEndHour}:${eventEndMinute} ${eventTimezone}`,
      }));
    }
  }, [eventHour, eventMinute, eventTimezone, isUntilDone, eventEndHour, eventEndMinute]);

  // Sinkronisasi nama pemilik acara ke formData.birthdayPersonName
  useEffect(() => {
    const combined = eventHosts.filter(Boolean).join(' & ');
    setFormData((prev) => ({
      ...prev,
      birthdayPersonName: combined || prev.eventName || '',
    }));
  }, [eventHosts]);

  // Muat draf pesanan jika ada
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.id) setOrderId(parsed.id);
        if (parsed.formData) setFormData((prev) => ({ ...prev, ...parsed.formData }));
        if (parsed.eventHosts && Array.isArray(parsed.eventHosts)) setEventHosts(parsed.eventHosts);
        if (parsed.selectedEventTag) setSelectedEventTag(parsed.selectedEventTag);
        if (parsed.eventHour) setEventHour(parsed.eventHour);
        if (parsed.eventMinute) setEventMinute(parsed.eventMinute);
        if (parsed.eventTimezone) setEventTimezone(parsed.eventTimezone);
        if (typeof parsed.isUntilDone === 'boolean') setIsUntilDone(parsed.isUntilDone);
        if (parsed.eventEndHour) setEventEndHour(parsed.eventEndHour);
        if (parsed.eventEndMinute) setEventEndMinute(parsed.eventEndMinute);
        if (parsed.musicMode) setMusicMode(parsed.musicMode);
        if (parsed.musicData) setMusicData((prev) => ({ ...prev, ...parsed.musicData }));
        if (parsed.dresscodeColors) setDresscodeColors(parsed.dresscodeColors);
        if (parsed.uploadedPhotos) setUploadedPhotos((prev) => ({ ...prev, ...parsed.uploadedPhotos }));
        if (parsed.additionalFeatures) setAdditionalFeatures(parsed.additionalFeatures);

        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.currentStage && !searchParams.get('stage')) setCurrentStage(parsed.currentStage);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }, []);

  // Muat info user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFormData(prev => ({
          ...prev,
          contactName: prev.contactName || user.displayName || user.email.split('@')[0] || '',
          contactPhone: prev.contactPhone || '',
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Handlers untuk Pemilik Acara dinamis
  const handleHostChange = (index, value) => {
    setEventHosts((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleAddHost = () => {
    setEventHosts((prev) => [...prev, '']);
  };

  const handleRemoveHost = (index) => {
    if (eventHosts.length > 1) {
      setEventHosts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handlers Jenis Acara
  const handleSelectTag = (tag) => {
    setSelectedEventTag(tag);
    if (tag !== 'Kustom') {
      setFormData((prev) => ({ ...prev, eventType: tag }));
    } else {
      setFormData((prev) => ({ ...prev, eventType: '' }));
    }
  };

  // Musik
  const [musicMode, setMusicMode] = useState('link'); // 'link' | 'manual'
  const [musicData, setMusicData] = useState({
    linkUrl: '',
    startTime: '0',
    endTime: '90',
    manualArtist: '',
    manualTitle: '',
  });

  // Dresscode colors
  const [dresscodeColors, setDresscodeColors] = useState([]);
  const [customColorHex, setCustomColorHex] = useState('#000000');
  const [customColorName, setCustomColorName] = useState('');

  // Gallery
  const [uploadedPhotos, setUploadedPhotos] = useState({
    gallery: [],
    videoTeaserUrl: '',
  });

  const [clientPhotos, setClientPhotos] = useState([]);

  // Fitur Tambahan (Addition) Checklist
  const [additionalFeatures, setAdditionalFeatures] = useState({
    countdownTimer: false,
    gift: false,
    dressCode: false,
    gallery: false,
    menuSelection: false,
    liveStreaming: false,
    qrCheckin: false,
    customDomain: false,
  });


  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    
    setPromoError('');

    const res = await validatePromoCode(code);
    
    if (res.success) {
      setAppliedPromo(res.promo ? { code, ...res.promo } : { code, discountPercent: res.discountPercent, promoType: 'percentage' });
    } else {
      setAppliedPromo(null);
      setPromoError(res.error || 'Kode promo tidak valid atau sudah kadaluarsa.');
    }
  };

  const handleRemovePromo = () => {
    setPromoCodeInput('');
    setAppliedPromo(null);
    setPromoError('');
  };
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFeature = (key) => {
    setAdditionalFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddPresetColor = (preset) => {
    if (!dresscodeColors.some((c) => c.hex.toLowerCase() === preset.hex.toLowerCase())) {
      setDresscodeColors((prev) => [...prev, { id: Date.now(), name: preset.name, hex: preset.hex }]);
    }
  };

  const handleAddCustomColor = () => {
    if (customColorHex) {
      setDresscodeColors((prev) => [
        ...prev,
        { id: Date.now(), name: customColorName || customColorHex, hex: customColorHex },
      ]);
    }
  };

  const handleRemoveColor = (id) => {
    setDresscodeColors((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddButton = () => {
    setFormData((prev) => ({
      ...prev,
      additionalButtons: [...prev.additionalButtons, { id: Date.now(), label: '', url: '' }],
    }));
  };

  const handleUpdateButton = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      additionalButtons: prev.additionalButtons.map((btn) =>
        btn.id === id ? { ...btn, [field]: value } : btn
      ),
    }));
  };

  const handleRemoveButton = (id) => {
    setFormData((prev) => ({
      ...prev,
      additionalButtons: prev.additionalButtons.filter((btn) => btn.id !== id),
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file, index) => ({
      id: Math.random().toString(36).substring(7),
      file: file,
      previewUrl: URL.createObjectURL(file),
      isMain: clientPhotos.length === 0 && index === 0,
      fileName: file.name
    }));
    setClientPhotos(prev => [...prev, ...newPhotos]);
    // Clear input
    e.target.value = null;
  };

  const handleSetMainPhoto = (id) => {
    setClientPhotos(prev => prev.map(p => ({ ...p, isMain: p.id === id })));
  };

  const handleRemovePhoto = (id) => {
    setClientPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Navigasi Navbar Khusus
  const handleBack = () => {
    if (currentStage === 1) {
      router.push(salesMode ? homePath : '/katalog');
    } else {
      goToStage(currentStage - 1);
    }
  };

  const validateStage = (stage) => {
    if (stage === 1) {
      if (!formData.eventName?.trim()) return 'Esensial: Nama Acara wajib diisi.';
      if (!formData.eventType?.trim()) return 'Esensial: Jenis Acara wajib diisi.';
      if (eventHosts.length === 0 || eventHosts.some(h => !h?.trim())) return 'Esensial: Nama Pemilik Acara wajib diisi.';
      if (!formData.guestGreetingFormat?.trim()) return 'Esensial: Format Kepada Yth wajib diisi.';
      if (!formData.quotesMessage?.trim()) return 'Esensial: Kutipan Pembuka wajib diisi.';
      if (!formData.eventDate?.trim()) return 'Esensial: Tanggal Acara wajib diisi.';
      if (!formData.eventVenue?.trim()) return 'Esensial: Tempat Acara wajib diisi.';
      if (!formData.eventAddress?.trim()) return 'Esensial: Alamat Acara wajib diisi.';
      if (!formData.eventMapsUrl?.trim()) return 'Esensial: Link Google Maps wajib diisi.';
      
      // Musik
      if (musicMode === 'link' && !musicData.linkUrl?.trim()) return 'Esensial: Link Musik wajib diisi.';
      if (musicMode === 'manual' && (!musicData.manualArtist?.trim() || !musicData.manualTitle?.trim())) return 'Esensial: Artis dan Judul Lagu Musik wajib diisi.';
      
      // Video
      if (isVideoEnabled && !formData.videoUrl?.trim() && !uploadedPhotos.videoTeaserUrl?.trim()) return 'Esensial: Tautan Video wajib diisi.';
      
      return null;
    }
    if (stage === 2) {
      if (additionalFeatures.dressCode && !formData.dresscodeText?.trim()) return 'Tambahan: Keterangan Dresscode wajib diisi.';
      if (additionalFeatures.liveStreaming && !formData.liveStreamingUrl?.trim()) return 'Tambahan: Link Live Streaming wajib diisi.';
      if (additionalFeatures.gallery && clientPhotos.length === 0) return 'Tambahan: Minimal 1 foto wajib diunggah untuk Galeri.';
      if (additionalFeatures.gift) {
        if (!formData.bankName?.trim() && !formData.giftPhysicalAddress?.trim()) return 'Tambahan: Data Rekening atau Alamat Fisik wajib diisi untuk Amplop Digital.';
        if (formData.bankName?.trim() && (!formData.accountNumber?.trim() || !formData.accountHolder?.trim())) return 'Tambahan: Nomor Rekening dan Nama Pemilik Rekening wajib diisi.';
      }
      if (additionalFeatures.menuSelection) {
        if (formData.menuMakananEnabled && !formData.menuMakananOptions?.trim()) return 'Tambahan: Pilihan Menu Makanan wajib diisi.';
        if (formData.menuMinumanEnabled && !formData.menuMinumanOptions?.trim()) return 'Tambahan: Pilihan Menu Minuman wajib diisi.';
        if (formData.menuBeverageEnabled && !formData.menuBeverageOptions?.trim()) return 'Tambahan: Pilihan Menu Beverage wajib diisi.';
      }
      if (additionalFeatures.customDomain && !formData.customDomainName?.trim()) return 'Tambahan: Nama Custom Domain wajib diisi.';
      return null;
    }
    if (stage === 3) {
      if (!formData.contactName?.trim()) return 'Pembayaran: Nama Kontak wajib diisi.';
      if (!formData.contactPhone?.trim()) return 'Pembayaran: Nomor Telepon / WhatsApp wajib diisi.';
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const errorMsg = validateStage(currentStage);
    if (errorMsg) {
      alert(errorMsg);
      return;
    }
    if (currentStage < 3) {
      goToStage(currentStage + 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftPayload = {
        id: orderId || undefined,
        formData,
        eventHosts,
        selectedEventTag,
        eventHour,
        eventMinute,
        eventTimezone,
        isUntilDone,
        eventEndHour,
        eventEndMinute,
        musicMode,
        musicData,
        dresscodeColors,
        uploadedPhotos,
        additionalFeatures,

        paymentMethod,
        currentStage,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
      
      // Save to database
      if (true) { // Always save to DB even if theme is not selected
        await saveDraft(selectedTheme?.id || 'unknown', selectedTheme?.name || 'Unknown Theme', draftPayload);
      }

      setIsSavedNotification(true);
      setTimeout(() => setIsSavedNotification(false), 2500);
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  };

  const baseThemePrice = selectedTheme?.basePrice || 99000;
  
  const activePlan = {
    id: 'base',
    name: 'Harga Dasar Tema',
    price: baseThemePrice,
  };

  // Rincian Biaya Fitur Tambahan (Add-ons)
  const additionalCostDetails = useMemo(() => {
    const items = [];
    if (isCountdownEnabled && additionalFeatures.countdownTimer) {
      items.push({
        key: 'countdownTimer',
        label: 'Countdown Timer',
        price: 0,
        formattedPrice: 'Rp 0',
      });
    }
    if (isDressCodeEnabled && additionalFeatures.dressCode) {
      items.push({
        key: 'dressCode',
        label: 'Dress Code',
        price: 0,
        formattedPrice: 'Rp 0',
      });
    }
    if (isGalleryEnabled && additionalFeatures.gallery) {
      const totalPhotos = uploadedPhotos.gallery?.length || 0;
      const extraPhotos = Math.max(0, totalPhotos - 6);
      const galleryCost = extraPhotos * 5000;
      items.push({
        key: 'gallery',
        label:
          extraPhotos > 0
            ? `Gallery (${totalPhotos} foto: 6 gratis + ${extraPhotos} ekstra)`
            : `Gallery (${totalPhotos} foto)`,
        price: galleryCost,
        formattedPrice:
          galleryCost > 0
            ? `Rp ${galleryCost.toLocaleString('id-ID')}`
            : 'Rp 0',
      });
    }
    if (isAmplopDigitalEnabled && additionalFeatures.gift) {
      items.push({
        key: 'gift',
        label: 'Amplop Digital',
        price: 10000,
        formattedPrice: 'Rp 10.000',
      });
    }
    if (isMenuSelectionEnabled && additionalFeatures.menuSelection) {
      const activeCats = [
        formData.menuMakananEnabled && 'Makanan',
        formData.menuMinumanEnabled && 'Minuman',
        formData.menuBeverageEnabled && 'Beverage',
      ].filter(Boolean);
      items.push({
        key: 'menuSelection',
        label:
          activeCats.length > 0
            ? `Menu Selection (${activeCats.join(', ')})`
            : 'Menu Selection',
        price: 10000,
        formattedPrice: 'Rp 10.000',
      });
    }
    if (isLiveStreamingEnabled && additionalFeatures.liveStreaming) {
      items.push({
        key: 'liveStreaming',
        label: 'Live Streaming',
        price: 10000,
        formattedPrice: 'Rp 10.000',
      });
    }
    if (isQrCheckinEnabled && additionalFeatures.qrCheckin) {
      items.push({
        key: 'qrCheckin',
        label: 'QR Code Check-in',
        price: 100000,
        formattedPrice: 'Rp 100.000',
      });
    }
    if (isCustomDomainEnabled && additionalFeatures.customDomain) {
      items.push({
        key: 'customDomain',
        label: 'Custom Domain .com',
        price: 300000,
        formattedPrice: 'Rp 300.000',
      });
    }
    return items;
  }, [
    additionalFeatures,
    uploadedPhotos.gallery,
    formData.menuMakananEnabled,
    formData.menuMinumanEnabled,
    formData.menuBeverageEnabled,
    isCountdownEnabled,
    isDressCodeEnabled,
    isGalleryEnabled,
    isAmplopDigitalEnabled,
    isMenuSelectionEnabled,
    isLiveStreamingEnabled,
    isQrCheckinEnabled,
    isCustomDomainEnabled
  ]);

  const totalAdditionalCost = useMemo(() => {
    return additionalCostDetails.reduce((sum, item) => sum + item.price, 0);
  }, [additionalCostDetails]);

  const pricing = useMemo(() => {
    return calculateOrderPricing(activePlan?.price || 0, totalAdditionalCost, appliedPromo, paymentMethod);
  }, [activePlan?.price, totalAdditionalCost, appliedPromo, paymentMethod]);

  const totalPaymentAmount = pricing.subtotal;
  const appliedDiscountAmount = pricing.discountAmount;
  const finalPaymentAmount = pricing.grandTotal;

  const buildOrderPayload = (status) => {
      const payloadId = orderId || `ORD-DA-${Date.now().toString().slice(-6)}`;
            const orderPayload = {
              id: payloadId,
              createdAt: new Date().toISOString(),
              themeId: activeThemeId || selectedTheme?.id || 'unknown',
              themeTitle: selectedTheme?.name || selectedTheme?.title || 'Dear Adore Theme',
              themeCategory: formData.eventType || selectedTheme?.category || 'Invitation',
              contactName: formData.contactName,
              contactPhone: formData.contactPhone,
      
              essentialFeatures: {
                acara: {
                  active: true,
                  eventName: formData.eventName.trim() || 'Undangan Acara',
                  eventType: formData.eventType.trim() || 'Acara Spesial',
                  eventHosts: eventHosts.filter(Boolean),
                },
                pesanUndangan: {
                  active: true,
                  guestGreetingFormat: formData.guestGreetingFormat,
                  quotesMessage: formData.quotesMessage,
                },
                detailAcara: {
                  active: true,
                  eventDate: formData.eventDate,
                  eventTime: formData.eventTime,
                  eventVenue: formData.eventVenue,
                  eventAddress: formData.eventAddress,
                  eventMapsUrl: formData.eventMapsUrl,
                },
                rsvpUcapan: {
                  active: true,
                },
                musik: {
                  active: true,
                  mode: musicMode,
                  linkUrl: musicData.linkUrl,
                  title:
                    musicMode === 'manual'
                      ? musicData.manualTitle || 'Lagu Pilihan'
                      : musicData.linkUrl || 'Tautan Musik',
                  artist: musicMode === 'manual' ? musicData.manualArtist || 'Artis' : 'Spotify / YouTube',
                  startTime: Number(musicData.startTime) || 0,
                  endTime: Number(musicData.endTime) || 90,
                },
              },
      
              additionalFeatures: {
                countdownTimer: {
                  active: additionalFeatures.countdownTimer,
                  title: formData.countdownTitle,
                  targetDate: formData.countdownTargetDate || formData.eventDate,
                },
                gift: {
                  active: additionalFeatures.gift,
                  bankName: formData.bankName,
                  accountNumber: formData.accountNumber,
                  accountHolder: formData.accountHolder,
                  physicalAddress: formData.giftPhysicalAddress,
                  buttons: formData.additionalButtons.filter((b) => b.label.trim() !== ''),
                },
                dressCode: {
                  active: additionalFeatures.dressCode,
                  text: formData.dresscodeText,
                  colors: dresscodeColors,
                },
                gallery: {
                  active: additionalFeatures.gallery,
                  photosCount: uploadedPhotos.gallery.length,
                  videoTeaserUrl: formData.videoUrl || uploadedPhotos.videoTeaserUrl,
                },
                menuSelection: {
                  active: additionalFeatures.menuSelection,
                  makanan: {
                    enabled: formData.menuMakananEnabled,
                    options: formData.menuMakananOptions,
                  },
                  minuman: {
                    enabled: formData.menuMinumanEnabled,
                    options: formData.menuMinumanOptions,
                  },
                  beverage: {
                    enabled: formData.menuBeverageEnabled,
                    options: formData.menuBeverageOptions,
                  },
                  options:
                    [
                      formData.menuMakananEnabled && formData.menuMakananOptions ? `Makanan: ${formData.menuMakananOptions}` : '',
                      formData.menuMinumanEnabled && formData.menuMinumanOptions ? `Minuman: ${formData.menuMinumanOptions}` : '',
                      formData.menuBeverageEnabled && formData.menuBeverageOptions ? `Beverage: ${formData.menuBeverageOptions}` : '',
                    ]
                      .filter(Boolean)
                      .join(' | ') || formData.rsvpMenuOptions,
                  askDietary: formData.rsvpAskDietary,
                  askGuestCount: formData.rsvpAskGuestCount,
                },
                liveStreaming: {
                  active: additionalFeatures.liveStreaming,
                  platform: formData.liveStreamingPlatform,
                  url: formData.liveStreamingUrl,
                  time: formData.liveStreamingTime,
                },
                qrCheckin: {
                  active: additionalFeatures.qrCheckin,
                  enabled: additionalFeatures.qrCheckin,
                },
                enableVideo: !!(formData.videoUrl || uploadedPhotos.videoTeaserUrl),
                videoUrl: formData.videoUrl || uploadedPhotos.videoTeaserUrl,
              },
      
              // Flat fields untuk kompatibilitas /akun & /admin
              videoUrl: formData.videoUrl || uploadedPhotos.videoTeaserUrl,
              selectedEssentialFeatures: cmsEssentialFeatures,
              eventName: formData.eventName.trim() || 'Undangan Acara',
              eventType: formData.eventType.trim() || 'Acara',
              birthdayPersonName: eventHosts.filter(Boolean).join(' & ') || formData.eventName || 'Pemilik Acara',
              quotesMessage: formData.quotesMessage,
              eventDate: formData.eventDate,
              eventTime: formData.eventTime,
              eventVenue: formData.eventVenue,
              eventAddress: formData.eventAddress,
              eventMapsUrl: formData.eventMapsUrl,
              whatsapp: '',
              dresscodeText: formData.dresscodeText,
              dresscodeColors: dresscodeColors,
              musicTitle:
                musicMode === 'manual'
                  ? musicData.manualTitle || 'Lagu Pilihan'
                  : musicData.linkUrl || 'Tautan Musik',
              musicArtist: musicMode === 'manual' ? musicData.manualArtist || 'Artis' : 'Spotify / YouTube',
              musicType: musicMode,
              package: {
                ...activePlan,
                basePrice: pricing.basePrice,
                additionalFeaturesPrice: pricing.addonTotal,
                totalPrice: pricing.grandTotal,
                price: pricing.grandTotal,
              },
              basePrice: pricing.basePrice,
              addonPrice: pricing.addonTotal,
              totalPrice: pricing.grandTotal,
              packagePrice: pricing.basePrice,
              additionalFeaturesPrice: pricing.addonTotal,
              additionalCostDetails: additionalCostDetails,
              promoApplied: appliedPromo,
              paymentMethod: {
                id: paymentMethod,
                name:
                  paymentMethod === 'bank_transfer'
                    ? 'Bank Transfer (VA)'
                    : paymentMethod === 'gopay'
                    ? 'GoPay'
                    : 'QRIS',
              },
              rawDraftData: {
                formData,
                eventHosts,
                selectedEventTag,
                eventHour,
                eventMinute,
                eventTimezone,
                isUntilDone,
                eventEndHour,
                eventEndMinute,
                musicMode,
                musicData,
                dresscodeColors,
                uploadedPhotos,
                additionalFeatures,
                paymentMethod,
                currentStage
              },
              status: status,
            };
      return orderPayload;
    };

  
  const handleExitSave = async () => {
    setIsProcessingPayment(true);
    try {
      const orderPayload = buildOrderPayload('ditunda');
      const uploadedUrls = [];

      // 1. Upload photos to Cloudinary (jika ada)
      if (clientPhotos.length > 0) {
        for (const photo of clientPhotos) {
          const formData = new FormData();
          formData.append('file', photo.file);
          formData.append('upload_preset', 'dearadore_preset'); // Pastikan preset ini aktif di Cloudinary
          formData.append('folder', `Client/${orderPayload.id}`); // Folder dinamis sesuai Order ID

          try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (res.ok && data.secure_url) {
              uploadedUrls.push({
                url: data.secure_url,
                isMain: photo.isMain,
                fileName: photo.fileName
              });
            }
          } catch (error) {
            console.error("Gagal koneksi ke Cloudinary:", error);
          }
        }
      }

      orderPayload.clientPhotos = uploadedUrls;


      const result = await createOrder(orderPayload);
      
      if (result.success) {
        localStorage.removeItem(DRAFT_KEY);
        router.push(homePath);
      } else {
        alert('Gagal menyimpan draf: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan draf.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleExitDiscard = async () => {
    setIsDiscarding(true);
    try {
      let targetId = orderId;
      if (!targetId) {
        try {
          const saved = localStorage.getItem(DRAFT_KEY);
          if (saved) {
            const p = JSON.parse(saved);
            if (p.id) targetId = p.id;
          }
        } catch (e) {}
      }

      if (targetId) {
        await deleteOrder(targetId);
      }
      if (selectedTheme?.id) {
        await deleteDraft(selectedTheme.id);
      }
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem('dearadore_order_draft');
      localStorage.removeItem('dearadore_sales_draft');
      setShowExitModal(false);
      router.push(homePath);
    } catch (err) {
      console.error('Error discarding draft:', err);
      alert('Terjadi kesalahan saat menghapus draf.');
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleExecutePayment = async () => {
    const errorStage1 = validateStage(1);
    if (errorStage1) {
      alert(errorStage1);
      goToStage(1);
      return;
    }
    const errorStage2 = validateStage(2);
    if (errorStage2) {
      alert(errorStage2);
      goToStage(2);
      return;
    }
    const errorStage3 = validateStage(3);
    if (errorStage3) {
      alert(errorStage3);
      goToStage(3);
      return;
    }
    setIsProcessingPayment(true);

    try {
      const orderPayload = buildOrderPayload('diproses');
      const uploadedUrls = [];

      // 1. Upload photos to Cloudinary (jika ada)
      if (clientPhotos.length > 0) {
        for (const photo of clientPhotos) {
          const formData = new FormData();
          formData.append('file', photo.file);
          formData.append('upload_preset', 'dearadore_preset'); // Pastikan preset ini aktif di Cloudinary
          formData.append('folder', `Client/${orderPayload.id}`); // Folder dinamis sesuai Order ID

          try {
            // Ganti 'YOUR_CLOUD_NAME' dengan cloud name Anda
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (res.ok && data.secure_url) {
              uploadedUrls.push({
                url: data.secure_url,
                isMain: photo.isMain,
                fileName: photo.fileName
              });
            } else {
              console.error("Cloudinary error response:", data);
              alert(`Gagal mengunggah gambar ${photo.fileName}:\n${data.error?.message || 'Unknown error'}`);
            }
          } catch (error) {
            console.error("Gagal koneksi ke Cloudinary:", error);
            alert(`Gagal koneksi ke server saat mengunggah ${photo.fileName}`);
          }
        }
      }

      orderPayload.clientPhotos = uploadedUrls;


      const result = await createOrder(orderPayload);
      
      if (result.success) {
        // Bersihkan draf setelah berhasil order
        localStorage.removeItem(DRAFT_KEY);
        setOrderSuccessData(orderPayload);
        goToStage(4);
      } else {
        alert('Gagal membuat pesanan: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (dbLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>Memuat Konfigurasi Pesanan...</div>;
  }

  return (
    <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem 7.5rem' }}>
      
      {/* EXIT MODAL */}
      {showExitModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>Simpan Perubahan?</h2>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Project ini belum disimpan. Apakah Anda ingin menyimpan ke antrean (Ditunda) atau menghapusnya?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button disabled={isProcessingPayment || isDiscarding} onClick={handleExitSave} style={{ background: '#111827', color: '#FFF', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: (isProcessingPayment || isDiscarding) ? 0.75 : 1 }}>
                {isProcessingPayment ? 'Menyimpan...' : 'Simpan & Keluar'}
              </button>
              <button disabled={isProcessingPayment || isDiscarding} onClick={handleExitDiscard} style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: (isProcessingPayment || isDiscarding) ? 0.75 : 1 }}>
                {isDiscarding ? 'Menghapus...' : 'Hapus'}
              </button>
              <button disabled={isProcessingPayment || isDiscarding} onClick={() => setShowExitModal(false)} style={{ background: 'transparent', color: '#4B5563', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: (isProcessingPayment || isDiscarding) ? 0.75 : 1 }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ROW WITH EXIT BUTTON */}
      {currentStage <= 3 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Buat Undangan</h1>
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            title="Keluar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#4B5563',
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* STEPPER */}
      {currentStage <= 3 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { step: 1, title: 'Esensial' },
            { step: 2, title: 'Tambahan' },
            { step: 3, title: 'Bayar' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                if (item.step > currentStage) {
                  for (let s = 1; s < item.step; s++) {
                    const err = validateStage(s);
                    if (err) {
                      alert(err);
                      if (currentStage !== s) goToStage(s);
                      return;
                    }
                  }
                }
                goToStage(item.step);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem 0.5rem',
                border: 'none',
                borderRadius: '8px',
                background: currentStage === item.step ? '#1F2937' : '#F9FAFB',
                color: currentStage === item.step ? '#FFFFFF' : '#4B5563',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: currentStage === item.step ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                  color: currentStage === item.step ? '#FFFFFF' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                {currentStage > item.step ? <Check size={11} /> : item.step}
              </span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* SELECTED THEME */}
      {currentStage <= 3 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>Tema Terpilih</span>
            <strong style={{ color: '#111827' }}>
              {selectedTheme?.name || selectedTheme?.title || 'Undangan Studio'}
            </strong>
          </div>
          {salesMode ? (
            <button
              type="button"
              onClick={() => setShowThemeSearchModal(true)}
              style={{
                fontSize: '0.8rem',
                color: '#374151',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Ganti <ArrowUpRight size={13} />
            </button>
          ) : (
            <Link
              href="/katalog"
              style={{
                fontSize: '0.8rem',
                color: '#374151',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontWeight: 600,
              }}
            >
              Ganti <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
      )}

      {/* ========================================================
          STAGE 1: FITUR ESENSIAL
         ======================================================== */}
      {currentStage === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* 1. Acara */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              1. Acara
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Nama Acara */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Nama Acara *
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="Ketik di sini..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />
              </div>

              {/* Jenis Acara: List berdasarkan tag & fill form */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                  Jenis Acara
                </label>
                {/* List Tag */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {eventTags.map((tag) => {
                    const isSelected = selectedEventTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: isSelected ? '#111827' : '#E5E7EB',
                          background: isSelected ? '#111827' : '#F9FAFB',
                          color: isSelected ? '#FFFFFF' : '#374151',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {/* Fill form Jenis Acara */}
                <input
                  type="text"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  placeholder="Ketik di sini..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />
              </div>

              {/* Pemilik Acara (Dinamis dengan tombol +) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                    Pemilik Acara *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddHost}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#111827',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: 0,
                    }}
                  >
                    <Plus size={14} /> Tambah Pemilik Acara
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {eventHosts.map((host, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => handleHostChange(idx, e.target.value)}
                        placeholder="Ketik di sini..."
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.85rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          outline: 'none',
                          background: '#FAFAFA',
                        }}
                      />
                      {eventHosts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHost(idx)}
                          style={{
                            padding: '0.6rem',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Hapus baris"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pesan Undangan (Format Sapaan & Quotes) */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              2. Pesan Undangan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Format Sapaan Tamu
                </label>
                <input
                  type="text"
                  name="guestGreetingFormat"
                  value={formData.guestGreetingFormat}
                  onChange={handleInputChange}
                  placeholder="Ketik di sini..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Quotes / Ucapan Pembuka
                </label>
                <textarea
                  name="quotesMessage"
                  rows={2}
                  value={formData.quotesMessage}
                  onChange={handleInputChange}
                  placeholder="Ketik di sini..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Detail Acara (Jadwal & Lokasi dengan Scroll Jam) */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              3. Detail Acara
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Tanggal Acara */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Tanggal Acara *
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    display: 'block',
                    boxSizing: 'border-box',
                    padding: '0 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#FAFAFA',
                    color: '#111827',
                    cursor: 'pointer',
                    height: '42px',
                    minHeight: '42px',
                    maxHeight: '42px',
                    lineHeight: '40px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                />
              </div>

              {/* Waktu / Jam Scrollable */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                    Waktu / Jam *
                  </label>
                  <label style={{ fontSize: '0.72rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isUntilDone}
                      onChange={(e) => setIsUntilDone(e.target.checked)}
                      style={{ accentColor: '#111827' }}
                    />
                    <span>Sampai Selesai</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {/* Jam Mulai (Scrollable Select) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FAFAFA', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.25rem 0.5rem', minHeight: '42px' }}>
                    <select
                      value={eventHour}
                      onChange={(e) => setEventHour(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#111827',
                        padding: '0.35rem 0.1rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {hoursList.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontWeight: 700, color: '#9CA3AF' }}>:</span>
                    <select
                      value={eventMinute}
                      onChange={(e) => setEventMinute(e.target.value)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#111827',
                        padding: '0.35rem 0.1rem',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {minutesList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jika tidak sampai selesai, tampilkan Jam Selesai */}
                  {!isUntilDone && (
                    <>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>s/d</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FAFAFA', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.25rem 0.5rem', minHeight: '42px' }}>
                        <select
                          value={eventEndHour}
                          onChange={(e) => setEventEndHour(e.target.value)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#111827',
                            padding: '0.35rem 0.1rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {hoursList.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <span style={{ fontWeight: 700, color: '#9CA3AF' }}>:</span>
                        <select
                          value={eventEndMinute}
                          onChange={(e) => setEventEndMinute(e.target.value)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#111827',
                            padding: '0.35rem 0.1rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {minutesList.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Zona Waktu */}
                  <select
                    value={eventTimezone}
                    onChange={(e) => setEventTimezone(e.target.value)}
                    style={{
                      background: '#FAFAFA',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      padding: '0.55rem 0.65rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#374151',
                      outline: 'none',
                      cursor: 'pointer',
                      minHeight: '42px',
                    }}
                  >
                    <option value="WIB">WIB</option>
                    <option value="WITA">WITA</option>
                    <option value="WIT">WIT</option>
                  </select>
                </div>
              </div>

              {/* Tempat / Venue */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                  Nama Tempat / Venue *
                </label>
                <input
                  type="text"
                  name="eventVenue"
                  value={formData.eventVenue}
                  onChange={handleInputChange}
                  placeholder="Ketik di sini..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />
              </div>

              {/* Alamat & Maps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    name="eventAddress"
                    value={formData.eventAddress}
                    onChange={handleInputChange}
                    placeholder="Ketik di sini..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#FAFAFA',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>
                    Tautan Google Maps
                  </label>
                  <input
                    type="url"
                    name="eventMapsUrl"
                    value={formData.eventMapsUrl}
                    onChange={handleInputChange}
                    placeholder="Ketik di sini..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#FAFAFA',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. RSVP / Ucapan */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.45rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              4. RSVP / Ucapan
            </h3>
            
            <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.5 }}>
              Form konfirmasi kehadiran (RSVP) dan buku doa/ucapan otomatis aktif pada website undangan.
            </p>

            {/* Konfirmasi Fitur Tambahan Tamu / +1 */}
            <div
              style={{
                border: '1px solid',
                borderColor: formData.rsvpAllowPlusOne ? '#111827' : '#E5E7EB',
                borderRadius: '10px',
                padding: '0.85rem',
                background: formData.rsvpAllowPlusOne ? '#FAFAFA' : '#FFFFFF',
                marginBottom: '1rem',
                transition: 'all 0.2s ease',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  name="rsvpAllowPlusOne"
                  checked={formData.rsvpAllowPlusOne}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rsvpAllowPlusOne: e.target.checked }))}
                  style={{ width: '16px', height: '16px', marginTop: '0.15rem', accentColor: '#111827', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                    Izinkan Tamu Membawa Pendamping (+1 / Pax Tambahan)
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#6B7280', marginTop: '0.2rem' }}>
                    Tamu dapat mengonfirmasi apakah hadir sendiri atau bersama pendamping/keluarga.
                  </div>
                </div>
              </label>

              {/* Jika +1 diaktifkan, tentukan batas maksimal */}
              {formData.rsvpAllowPlusOne && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #E5E7EB' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                    Batas Maksimal Pendamping per Undangan
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '320px' }}>
                    <input
                      type="number"
                      name="rsvpMaxPlusOne"
                      min={1}
                      max={10}
                      value={formData.rsvpMaxPlusOne}
                      onChange={handleInputChange}
                      style={{
                        width: '75px',
                        padding: '0.55rem 0.65rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        background: '#FFFFFF',
                        color: '#111827',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                      Orang (Maks. {formData.rsvpMaxPlusOne} pendamping per tamu)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Catatan Menu Selection */}
            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.65rem',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#111827', marginBottom: '0.2rem' }}>
                  Ingin Tamu & Pendamping Memilih Menu Makanan?
                </strong>
                <p style={{ margin: 0, fontSize: '0.775rem', color: '#4B5563', lineHeight: 1.45 }}>
                  Jika acara Anda menyajikan pilihan set menu (misal: Daging / Ayam / Vegetarian / Kids), aktifkan fitur <strong>Menu Selection</strong> di tahap <strong>Tambahan</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToStage(2)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#111827',
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Pilih di Tambahan</span>
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          {/* 5. Musik */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              5. Musik
            </h3>

            {/* Mode Tab */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {[
                { id: 'link', label: 'Tautan Spotify / YouTube' },
                { id: 'manual', label: 'Ketik Manual' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMusicMode(m.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: musicMode === m.id ? '#111827' : '#E5E7EB',
                    background: musicMode === m.id ? '#111827' : '#FFFFFF',
                    color: musicMode === m.id ? '#FFFFFF' : '#374151',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {musicMode === 'link' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="url"
                  placeholder="Ketik di sini..."
                  value={musicData.linkUrl}
                  onChange={(e) => setMusicData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Mulai (Detik Ke-)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={musicData.startTime}
                      onChange={(e) => setMusicData((prev) => ({ ...prev, startTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Selesai (Detik Ke-)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={musicData.endTime}
                      onChange={(e) => setMusicData((prev) => ({ ...prev, endTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {musicMode === 'manual' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Ketik di sini..."
                  value={musicData.manualArtist}
                  onChange={(e) => setMusicData((prev) => ({ ...prev, manualArtist: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: '#FAFAFA',
                  }}
                />
                <input
                  type="text"
                  placeholder="Ketik di sini..."
                  value={musicData.manualTitle}
                  onChange={(e) => setMusicData((prev) => ({ ...prev, manualTitle: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: '#FAFAFA',
                  }}
                />
              </div>
            )}
          </div>

          {/* 6. Video (Esensial - Default) */}
          {isVideoEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                6. Video
              </h3>

              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 1rem', lineHeight: 1.45 }}>
                Sematkan tautan video momen spesial, prewedding, atau teaser acara (YouTube, Vimeo, dsb).
              </p>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.35rem',
                  }}
                >
                  Tautan Video (YouTube / Vimeo / Video URL)
                </label>
                <input
                  type="url"
                  placeholder="Ketik di sini..."
                  value={formData.videoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, videoUrl: val }));
                    setUploadedPhotos((prev) => ({ ...prev, videoTeaserUrl: val }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    background: '#FAFAFA',
                  }}
                />
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: '#9CA3AF',
                    marginTop: '0.35rem',
                  }}
                >
                  💡 Video akan ditampilkan di dalam undangan digital Anda.
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================
          STAGE 2: FITUR TAMBAHAN (ADDITION)
         ======================================================== */}
      {currentStage === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {/* 1. Countdown Timer */}
            {isCountdownEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.countdownTimer ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.countdownTimer}
                    onChange={() => toggleFeature('countdownTimer')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Countdown Timer</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  Rp 0
                </span>
              </label>

              {additionalFeatures.countdownTimer && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Judul Pengingat
                    </label>
                    <input
                      type="text"
                      name="countdownTitle"
                      value={formData.countdownTitle}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Target Waktu
                    </label>
                    <input
                      type="datetime-local"
                      name="countdownTargetDate"
                      value={formData.countdownTargetDate}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 2. Dress Code */}
            {isDressCodeEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.dressCode ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.dressCode}
                    onChange={() => toggleFeature('dressCode')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Dress Code</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  Rp 0
                </span>
              </label>

              {additionalFeatures.dressCode && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Panduan Dress Code
                    </label>
                    <input
                      type="text"
                      name="dresscodeText"
                      placeholder="Ketik di sini..."
                      value={formData.dresscodeText}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>

                  {/* Color swatches */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.35rem' }}>
                      Palet Warna Terpilih
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      {dresscodeColors.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: '1px solid #D1D5DB' }} />
                          <span>{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(c.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={12} color="#9CA3AF" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {presetColors.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleAddPresetColor(p)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.hex }} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 3. Gallery */}
            {isGalleryEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.gallery ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.gallery}
                    onChange={() => toggleFeature('gallery')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Gallery</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: (uploadedPhotos.gallery?.length || 0) > 6 ? '#111827' : '#059669',
                    background: (uploadedPhotos.gallery?.length || 0) > 6 ? '#F3F4F6' : '#ECFDF5',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                  }}
                >
                  {(uploadedPhotos.gallery?.length || 0) > 6
                    ? `+Rp ${(((uploadedPhotos.gallery?.length || 0) - 6) * 5000).toLocaleString('id-ID')}`
                    : 'Rp 0 (Maks. 6)'}
                </span>
              </label>

              {additionalFeatures.gallery && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                    Gratis hingga 6 foto. Jika lebih dari 6 foto, dikenakan biaya tambahan Rp 5.000 / foto.
                    {clientPhotos.length > 6 && (
                      <span style={{ display: 'block', color: '#B45309', fontWeight: 600, marginTop: '0.25rem' }}>
                        {clientPhotos.length} foto ({6} gratis + {clientPhotos.length - 6} foto tambahan = +Rp {(((clientPhotos.length - 6) * 5000)).toLocaleString('id-ID')})
                      </span>
                    )}
                  </div>
                  <label
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px dashed #D1D5DB',
                      borderRadius: '8px',
                      background: '#FAFAFA',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      color: '#4B5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <UploadCloud size={16} />
                    <span>
                      {clientPhotos.length > 0
                        ? `${clientPhotos.length} Foto Ditambahkan`
                        : 'Tambah Foto Galeri'}
                    </span>
                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                  </label>

                  {clientPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                      {clientPhotos.map((photo) => (
                        <div key={photo.id} style={{ 
                          minWidth: '100px', 
                          border: photo.isMain ? '2px solid #D4AF37' : '1px solid #E5E7EB', 
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <img src={photo.previewUrl} alt={photo.fileName} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                          <div style={{ padding: '4px', textAlign: 'center', background: '#FAFAFA' }}>
                            {photo.isMain ? (
                              <span style={{ color: '#D4AF37', fontSize: '10px', fontWeight: 'bold' }}>★ Utama</span>
                            ) : (
                              <button type="button" onClick={() => handleSetMainPhoto(photo.id)} style={{ fontSize: '10px', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', padding: 0 }}>
                                Jadikan Utama
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Tautan Video Teaser (Opsional)
                    </label>
                    <input
                      type="url"
                      placeholder="Ketik di sini..."
                      value={uploadedPhotos.videoTeaserUrl}
                      onChange={(e) =>
                        setUploadedPhotos((prev) => ({ ...prev, videoTeaserUrl: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 4. Amplop Digital */}
            {isAmplopDigitalEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.gift ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.gift}
                    onChange={() => toggleFeature('gift')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Amplop Digital</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', background: '#F3F4F6', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  +Rp 10.000
                </span>
              </label>

              {additionalFeatures.gift && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                        Bank / E-Wallet
                      </label>
                      <select
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          background: '#FAFAFA',
                        }}
                      >
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="BSI">BSI</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        placeholder="Ketik di sini..."
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          background: '#FAFAFA',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      name="accountHolder"
                      placeholder="Ketik di sini..."
                      value={formData.accountHolder}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Alamat Kirim Kado Fisik (Opsional)
                    </label>
                    <input
                      type="text"
                      name="giftPhysicalAddress"
                      placeholder="Ketik di sini..."
                      value={formData.giftPhysicalAddress}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 5. Menu Selection */}
            {isMenuSelectionEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.menuSelection ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.menuSelection}
                    onChange={() => toggleFeature('menuSelection')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Menu Selection</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', background: '#F3F4F6', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  +Rp 10.000
                </span>
              </label>

              {additionalFeatures.menuSelection && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.5rem' }}>
                      Kategori Pilihan Menu (Centang untuk aktifkan):
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                      {/* Kolom 1: Makanan */}
                      <div
                        style={{
                          border: '1px solid',
                          borderColor: formData.menuMakananEnabled ? '#111827' : '#E5E7EB',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          background: formData.menuMakananEnabled ? '#FFFFFF' : '#F9FAFB',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                            color: formData.menuMakananEnabled ? '#111827' : '#9CA3AF',
                            cursor: 'pointer',
                            marginBottom: '0.45rem',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.menuMakananEnabled}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, menuMakananEnabled: e.target.checked }))
                            }
                            style={{ accentColor: '#111827', width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span>Makanan</span>
                        </label>
                        <input
                          type="text"
                          name="menuMakananOptions"
                          placeholder="Ketik di sini..."
                          value={formData.menuMakananOptions}
                          disabled={!formData.menuMakananEnabled}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            background: formData.menuMakananEnabled ? '#FAFAFA' : '#F3F4F6',
                            color: formData.menuMakananEnabled ? '#111827' : '#9CA3AF',
                            cursor: formData.menuMakananEnabled ? 'text' : 'not-allowed',
                          }}
                        />
                      </div>

                      {/* Kolom 2: Minuman */}
                      <div
                        style={{
                          border: '1px solid',
                          borderColor: formData.menuMinumanEnabled ? '#111827' : '#E5E7EB',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          background: formData.menuMinumanEnabled ? '#FFFFFF' : '#F9FAFB',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                            color: formData.menuMinumanEnabled ? '#111827' : '#9CA3AF',
                            cursor: 'pointer',
                            marginBottom: '0.45rem',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.menuMinumanEnabled}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, menuMinumanEnabled: e.target.checked }))
                            }
                            style={{ accentColor: '#111827', width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span>Minuman</span>
                        </label>
                        <input
                          type="text"
                          name="menuMinumanOptions"
                          placeholder="Ketik di sini..."
                          value={formData.menuMinumanOptions}
                          disabled={!formData.menuMinumanEnabled}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            background: formData.menuMinumanEnabled ? '#FAFAFA' : '#F3F4F6',
                            color: formData.menuMinumanEnabled ? '#111827' : '#9CA3AF',
                            cursor: formData.menuMinumanEnabled ? 'text' : 'not-allowed',
                          }}
                        />
                      </div>

                      {/* Kolom 3: Beverage */}
                      <div
                        style={{
                          border: '1px solid',
                          borderColor: formData.menuBeverageEnabled ? '#111827' : '#E5E7EB',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          background: formData.menuBeverageEnabled ? '#FFFFFF' : '#F9FAFB',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                            color: formData.menuBeverageEnabled ? '#111827' : '#9CA3AF',
                            cursor: 'pointer',
                            marginBottom: '0.45rem',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.menuBeverageEnabled}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, menuBeverageEnabled: e.target.checked }))
                            }
                            style={{ accentColor: '#111827', width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span>Beverage</span>
                        </label>
                        <input
                          type="text"
                          name="menuBeverageOptions"
                          placeholder="Ketik di sini..."
                          value={formData.menuBeverageOptions}
                          disabled={!formData.menuBeverageEnabled}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.65rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            background: formData.menuBeverageEnabled ? '#FAFAFA' : '#F3F4F6',
                            color: formData.menuBeverageEnabled ? '#111827' : '#9CA3AF',
                            cursor: formData.menuBeverageEnabled ? 'text' : 'not-allowed',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.rsvpAskDietary}
                        onChange={(e) => setFormData((prev) => ({ ...prev, rsvpAskDietary: e.target.checked }))}
                        style={{ accentColor: '#111827' }}
                      />
                      <span>Kolom Alergi</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.rsvpAskGuestCount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, rsvpAskGuestCount: e.target.checked }))}
                        style={{ accentColor: '#111827' }}
                      />
                      <span>Kolom Jumlah Pax (+1)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 6. Live Streaming */}
            {isLiveStreamingEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.liveStreaming ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.liveStreaming}
                    onChange={() => toggleFeature('liveStreaming')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>Live Streaming</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', background: '#F3F4F6', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  +Rp 10.000
                </span>
              </label>

              {additionalFeatures.liveStreaming && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Platform
                    </label>
                    <select
                      name="liveStreamingPlatform"
                      value={formData.liveStreamingPlatform}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    >
                      <option value="YouTube Live">YouTube Live</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Instagram Live">Instagram Live</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Tautan Streaming
                    </label>
                    <input
                      type="url"
                      name="liveStreamingUrl"
                      placeholder="Ketik di sini..."
                      value={formData.liveStreamingUrl}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 7. QR Code Check-in */}
            {isQrCheckinEnabled && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid',
                borderColor: additionalFeatures.qrCheckin ? '#111827' : '#E5E7EB',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={additionalFeatures.qrCheckin}
                    onChange={() => toggleFeature('qrCheckin')}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                  />
                  <span>QR Code Check-in</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', background: '#F3F4F6', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  +Rp 100.000
                </span>
              </label>

              {additionalFeatures.qrCheckin && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6', fontSize: '0.8rem', color: '#4B5563' }}>
                  QR pass digital otomatis aktif untuk setiap tamu yang mengonfirmasi kehadiran.
                </div>
              )}
            </div>
            )}

            {/* 8. Custom Domain */}
            {isCustomDomainEnabled && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid',
                  borderColor: additionalFeatures.customDomain ? '#111827' : '#E5E7EB',
                  borderRadius: '12px',
                  padding: '1rem',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#111827',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input
                      type="checkbox"
                      checked={additionalFeatures.customDomain}
                      onChange={() => toggleFeature('customDomain')}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                    />
                    <span>Custom Domain .com</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111827', background: '#F3F4F6', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                    +Rp 300.000
                  </span>
                </label>

                {additionalFeatures.customDomain && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #F3F4F6' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.2rem' }}>
                      Domain Pilihan Anda (contoh: dearadore.com)
                    </label>
                    <input
                      type="text"
                      name="customDomainName"
                      placeholder="Ketik di sini..."
                      value={formData.customDomainName || ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        background: '#FAFAFA',
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STAGE 3: RINGKASAN & PEMBAYARAN
         ======================================================== */}
      {currentStage === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>


          {/* Informasi Kontak */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              Informasi Kontak
            </h3>
            <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.8rem' }}>
              Informasi ini digunakan untuk menghubungi Anda terkait pesanan. Akan disimpan otomatis ke profil Anda jika belum ada.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, color: '#374151' }}>
                  Nama Lengkap <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  placeholder="Ketik nama lengkap..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: '#FAFAFA',
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 600, color: '#374151' }}>
                  Nomor Telepon / WhatsApp <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="Contoh: +6281234567890"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    background: '#FAFAFA',
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              Ringkasan Pesanan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#374151' }}>
              <div>
                <span style={{ color: '#6B7280' }}>Nama Acara: </span>
                <strong>{formData.eventName || formData.birthdayPersonName || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Jenis Acara: </span>
                <span>{formData.eventType || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Pemilik Acara: </span>
                <span>{eventHosts.filter(Boolean).join(' & ') || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Waktu & Lokasi: </span>
                <span>{formData.eventDate || '-'} ({formData.eventTime || '-'}) • {formData.eventVenue || '-'}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>RSVP: </span>
                <span>
                  Otomatis Aktif {formData.rsvpAllowPlusOne ? `(Maks. +${formData.rsvpMaxPlusOne} Pendamping)` : '(Tanpa Pendamping)'}
                </span>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>Musik: </span>
                <span>
                  {musicMode === 'manual'
                    ? `${musicData.manualTitle || 'Lagu Pilihan'} - ${musicData.manualArtist || 'Artis'}`
                    : musicData.linkUrl || 'Tautan Musik'}
                </span>
              </div>
              {additionalFeatures.customDomain && formData.customDomainName && (
                <div>
                  <span style={{ color: '#6B7280' }}>Custom Domain: </span>
                  <strong>{formData.customDomainName}</strong>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  Rincian Biaya
                </div>

                {/* Harga Paket */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#4B5563' }}>Paket {selectedTheme?.tier || 'Basic'} (Tema: {selectedTheme?.name || activePlan.name})</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    Rp {pricing.basePrice.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Promo Code Info in Summary */}
                {appliedPromo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                    <span>Diskon Promo Referral (20%)</span>
                    <span>-Rp {pricing.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '1px dashed #E5E7EB', marginBottom: '0.5rem', marginTop: '0.2rem' }}>
                  <span>Subtotal Paket</span>
                  <span>Rp {pricing.discountedBase.toLocaleString('id-ID')}</span>
                </div>

                {/* Fitur Tambahan */}
                {additionalCostDetails.length > 0 ? (
                  <div style={{ margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Fitur Tambahan (Nett)
                    </div>
                    {additionalCostDetails.map((item) => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4B5563' }}>
                        <span>- {item.label}</span>
                        <span style={{ fontWeight: item.price > 0 ? 600 : 400, color: item.price > 0 ? '#111827' : '#059669' }}>
                          {item.formattedPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4B5563' }}>
                    <span>Subtotal Keseluruhan</span>
                    <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#4B5563' }}>
                    <span>Biaya Layanan & Penanganan</span>
                    <span>Rp {pricing.displayedServiceFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Total Pembayaran */}
                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '2px dashed #D1D5DB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>TOTAL PEMBAYARAN:</span>
                  <strong style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>
                    Rp {pricing.grandTotal.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kode Promo */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={18} color="var(--color-primary)" />
              Kode Promo
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Ketik di sini..."
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                disabled={!!appliedPromo}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  textTransform: 'uppercase',
                  background: appliedPromo ? '#F3F4F6' : '#FFFFFF',
                }}
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#FEE2E2',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={!promoCodeInput}
                  style={{
                    padding: '0.65rem 1rem',
                    background: promoCodeInput ? '#111827' : '#E5E7EB',
                    color: promoCodeInput ? '#FFFFFF' : '#9CA3AF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: promoCodeInput ? 'pointer' : 'not-allowed',
                  }}
                >
                  Gunakan
                </button>
              )}
            </div>
            {promoError && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#EF4444' }}>
                {promoError}
              </p>
            )}
            {appliedPromo && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Check size={14} /> Berhasil! Diskon Rp {appliedDiscountAmount.toLocaleString('id-ID')} telah digunakan.
              </p>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
              Metode Pembayaran
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'bank_transfer', label: 'Bank Transfer (VA)' },
                { id: 'gopay', label: 'GoPay' },
                { id: 'qris', label: 'QRIS' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    padding: '0.65rem 0.5rem',
                    border: '1px solid',
                    borderColor: paymentMethod === m.id ? '#111827' : '#E5E7EB',
                    borderRadius: '8px',
                    background: paymentMethod === m.id ? '#F9FAFB' : '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          NAVBAR KHUSUS FORM BUAT PESANAN
          (Kembali) (Simpan) (Lanjut / Konfirmasi)
         ======================================================== */}
      {currentStage <= 3 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            width: 'calc(100% - 2rem)',
            maxWidth: '640px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            padding: '0.45rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          {/* Tombol KEMBALI */}
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9999px',
              border: '1px solid #E5E7EB',
              background: '#FFFFFF',
              color: '#374151',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={15} />
            <span>Kembali</span>
          </button>


          {/* Tombol LANJUT (Stage 1 & 2) atau KONFIRMASI (Stage 3) */}
          {currentStage < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1.35rem',
                borderRadius: '9999px',
                border: 'none',
                background: '#111827',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Lanjut</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={isProcessingPayment}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1.35rem',
                borderRadius: '9999px',
                border: 'none',
                background: '#111827',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isProcessingPayment ? 0.75 : 1,
              }}
            >
              <span>{isProcessingPayment ? 'Memproses...' : 'Konfirmasi'}</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================
          STAGE 4: SELESAI
         ======================================================== */}
      {currentStage === 4 && orderSuccessData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#111827',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Check size={24} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#111827' }}>
            Pesanan Berhasil
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
            ID Pesanan: <strong>{orderSuccessData.id}</strong> ({orderSuccessData.essentialFeatures?.acara?.eventName || orderSuccessData.birthdayPersonName})
          </p>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0.85rem 1rem', margin: '0 auto 1.5rem', maxWidth: '380px', textAlign: 'left', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#6B7280' }}>Subtotal Paket:</span>
              <span style={{ fontWeight: 500, color: '#111827' }}>
                Rp {(orderSuccessData.packagePrice || orderSuccessData.package?.basePrice || orderSuccessData.basePrice || 0).toLocaleString('id-ID')}
              </span>
            </div>
            {orderSuccessData.promoApplied && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#059669' }}>
                <span>Diskon Promo Referral (20%):</span>
                <span style={{ fontWeight: 500 }}>
                  -Rp {( (orderSuccessData.packagePrice || orderSuccessData.basePrice || 0) * 0.2 ).toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {orderSuccessData.additionalFeaturesPrice > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#6B7280' }}>Fitur Tambahan (Nett):</span>
                <span style={{ fontWeight: 500, color: '#111827' }}>
                  +Rp {orderSuccessData.additionalFeaturesPrice.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.45rem', marginTop: '0.45rem', borderTop: '1px solid #E5E7EB', fontWeight: 700, fontSize: '0.9rem' }}>
              <span style={{ color: '#111827' }}>Total Pembayaran:</span>
              <span style={{ color: '#111827' }}>
                Rp {(orderSuccessData.totalPrice || orderSuccessData.package?.price || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Link
              href={homePath}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#111827',
                color: '#FFFFFF',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Lihat di Akun
            </Link>
            <Link
              href="/katalog"
              style={{
                padding: '0.65rem 1.25rem',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#374151',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Katalog
            </Link>
          </div>
        </motion.div>
      )}

      {/* Modal Cari Tema (Sales Mode) */}
      {showThemeSearchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Ganti Tema</h3>
              <button onClick={() => setShowThemeSearchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <input 
              type="text" 
              placeholder="Cari nama tema..." 
              value={themeSearchQuery}
              onChange={(e) => setThemeSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
              {allProducts.filter(p => p.name.toLowerCase().includes(themeSearchQuery.toLowerCase())).slice(0, 10).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveThemeId(p.id);
                    setShowThemeSearchModal(false);
                  }}
                  style={{ textAlign: 'left', padding: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <strong style={{ display: 'block', color: '#111827' }}>{p.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.category} - Rp {p.price.toLocaleString('id-ID')}</span>
                </button>
              ))}
              {allProducts.filter(p => p.name.toLowerCase().includes(themeSearchQuery.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', color: '#6B7280', padding: '1rem' }}>Tema tidak ditemukan</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OrderWizard({ salesMode = false }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Memuat form...</p>
        </div>
      }
    >
      <OrderWizardContent salesMode={salesMode} />
    </Suspense>
  );
}
