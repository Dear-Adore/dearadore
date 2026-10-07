export const categories = [
  'Semua',
  'Birthday',
  'Wedding',
  'Anniversary',
  'Graduation',
  'Ceremony',
  'Baby Shower',
];

export const DEFAULT_ESSENTIAL_FEATURES = [
  'Custom Nama Tamu Undangan',
  'Detail Acara',
  'RSVP / Ucapan',
  'Musik',
  'Video',
];

export const DEFAULT_ADDITIONAL_FEATURES = [
  'Countdown Timer',
  'Gift',
  'Dress Code',
  'Gallery',
  'Menu Selection',
  'Live Streaming',
  'QR Code Check-in',
  'Custom Domain .com',
];

export const sortOptions = [
  { key: 'terpopuler', label: 'Paling Populer' },
  { key: 'terbaru', label: 'Paling Terbaru' },
  { key: 'harga_rendah', label: 'Harga: Terendah ke Tertinggi' },
  { key: 'harga_tinggi', label: 'Harga: Tertinggi ke Terendah' },
];

export const colorOptions = [
  { key: 'merah', label: 'Merah', hex: '#EF4444' },
  { key: 'jingga', label: 'Jingga', hex: '#F97316' },
  { key: 'kuning', label: 'Kuning', hex: '#EAB308' },
  { key: 'hijau', label: 'Hijau', hex: '#22C55E' },
  { key: 'biru', label: 'Biru', hex: '#3B82F6' },
  { key: 'nila', label: 'Nila', hex: '#6366F1' },
  { key: 'ungu', label: 'Ungu', hex: '#A855F7' },
  { key: 'merah_muda', label: 'Merah Muda (Pink)', hex: '#EC4899' },
  { key: 'bnw', label: 'Hitam & Putih', hex: 'linear-gradient(135deg, #000000 50%, #FFFFFF 50%)' },
  { key: 'gold', label: 'Emas (Gold)', hex: '#D4AF37' },
  { key: 'silver', label: 'Perak (Silver)', hex: '#C0C0C0' },
];

const rawKatalogProducts = [];

export const katalogProducts = rawKatalogProducts.map((p) => ({
  ...p,
  essentialFeatures: p.essentialFeatures || [...DEFAULT_ESSENTIAL_FEATURES],
  additionalFeatures: p.additionalFeatures || [...DEFAULT_ADDITIONAL_FEATURES],
}));
