const CACHE_PREFIX = 'adore_cache_';
const DEFAULT_TTL = 1000 * 60 * 15; // 15 menit

export const AdoreCache = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    
    const cachedStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!cachedStr) return null;
    
    try {
      const cached = JSON.parse(cachedStr);
      // Cek kedaluwarsa
      if (Date.now() > cached.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return cached.data;
    } catch (e) {
      return null;
    }
  },
  
  set: (key, data, ttl = DEFAULT_TTL) => {
    if (typeof window === 'undefined') return;
    
    const item = {
      data,
      expiry: Date.now() + ttl,
    };
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch(e) {
      // Handle kuota localStorage penuh
      console.warn("AdoreCache: LocalStorage penuh");
    }
  },
  
  clear: (key) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_PREFIX + key);
  },
  
  clearAll: () => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};
