import { MenuItem, SiteContent, Testimonial, Order } from '../types';

// --- STORAGE KEYS ---
const KEYS = {
  MENU: 'joshem_menu_data_v2',
  CONTENT: 'joshem_site_content_v2',
  TESTIMONIALS: 'joshem_testimonials_v2',
  ORDERS: 'joshem_orders_v2',
  AUTH_PASS: 'joshem_auth_pass_v2'
};

// --- RICH FALLBACK DATA ---
export const FALLBACK_MENU: MenuItem[] = [
    {
      id: '1',
      name: 'Chicken Adobo',
      description: 'The national dish. Chicken marinated in vinegar, soy sauce, garlic, and peppercorns, braised to savory perfection.',
      prices: { small: 10.99, large: 15.99 },
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=800',
      visible: true,
      isDailySpecial: true
    },
    {
      id: '2',
      name: 'Lumpia Shanghai',
      description: 'Crispy fried spring rolls filled with savory ground pork, carrots, and onions. Served with sweet chili sauce.',
      prices: { small: 8.50, large: 14.50 },
      category: 'Appetizer',
      image: 'https://images.unsplash.com/photo-1626804475297-411dbe63c4df?auto=format&fit=crop&q=80&w=800',
      visible: true,
      isDailySpecial: false
    },
    {
      id: '3',
      name: 'Sinigang na Baboy',
      description: 'A comforting sour tamarind soup with tender pork belly, kangkong (water spinach), and vegetables.',
      prices: { small: 12.50, large: 18.50 },
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1604579963283-f661759695d6?auto=format&fit=crop&q=80&w=800',
      visible: true,
      isDailySpecial: false
    }
];

export const FALLBACK_CONTENT: SiteContent = {
  hero: {
    images: [
      { id: 'h1', url: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=1920", visible: true },
      { id: 'h2', url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1920", visible: true },
      { id: 'h3', url: "https://images.unsplash.com/photo-1534944923498-84e45eb3dbf4?auto=format&fit=crop&q=80&w=1920", visible: true }
    ]
  },
  about: {
      title: "Our Heritage",
      subtitle: "Authentic Filipino flavors served with a smile.",
      storyTitle: "From Our Kitchen to Yours",
      storyText: "JoShem Foods started as a small family gathering where recipes passed down from our Lola (Grandmother) were the highlight of every weekend. Today, we bring those same authentic flavors to you.",
      storyImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
    },
    contact: {
      address: "123 Manila Avenue, Food District, CA 90000",
      phone: "(555) 123-4567",
      email: "orders@joshemfoods.com",
      hours: {
        monFri: "10:00 AM - 9:00 PM",
        sat: "11:00 AM - 10:00 PM",
        sun: "Closed"
      }
    },
    socials: {
      facebook: "https://facebook.com/joshemfoods",
      instagram: "https://instagram.com/joshemfoods",
      twitter: "https://twitter.com/joshemfoods"
    }
  };

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
    { id: 1, name: "Maria Santos", rating: 5, text: "Absolutely the best Filipino food I've had outside of Manila. The Adobo tastes just like home!" },
    { id: 2, name: "Ricardo Batungbakal", rating: 5, text: "The Lumpia Shanghai is incredibly crispy! I ordered 50 pieces for my son's birthday and they were gone in minutes. Highly recommend JoShem for any party catering." }
];

// Helper to get from LocalStorage
const getLocal = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }
};

// Guaranteed Timeout wrapper using Promise.race
const fetchWithTimeout = async (url: string, options: RequestInit = {}, ms = 2000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  
  try {
    const request = fetch(url, { ...options, signal: controller.signal });
    const response = await Promise.race([request, timeout]);
    clearTimeout(id);
    return response as Response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

// --- PUBLIC API ---

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const res = await fetchWithTimeout('/api/data');
    return res.ok;
  } catch (e) {
    return false;
  }
};

const getFromHybrid = async <T>(apiPath: string, localKey: string, fallback: T, wrapper?: string): Promise<T> => {
  const cached = getLocal<T>(localKey);
  try {
    const res = await fetchWithTimeout(`/api${apiPath}`);
    if (res.ok) {
      const data = await res.json();
      const result = wrapper ? data[wrapper] : data;
      
      // If the server has valid non-empty data, prioritize it and sync cache
      if (result && (!Array.isArray(result) || result.length > 0)) {
        setLocal(localKey, result);
        return result;
      }
      
      // If the server returns empty, but we have cache, use the cache (user data)
      if (cached && (!Array.isArray(cached) || (cached as any).length > 0)) {
        return cached;
      }
    }
  } catch (e) {
    console.info(`Sync ignored for ${apiPath} (Offline). Using Cache.`);
  }
  
  // Return cache if exists, otherwise the rich hardcoded fallbacks
  return cached || fallback;
};

const saveToHybrid = async (apiPath: string, localKey: string, data: any): Promise<{success: boolean, synced: boolean}> => {
  setLocal(localKey, data);
  try {
    const res = await fetchWithTimeout(`/api${apiPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { success: true, synced: res.ok };
  } catch (e) {
    return { success: true, synced: false };
  }
};

export const getMenu = () => getFromHybrid<MenuItem[]>('/data', KEYS.MENU, FALLBACK_MENU, 'menu');
export const saveMenu = (items: MenuItem[]) => saveToHybrid('/menu', KEYS.MENU, items);

export const getSiteContent = () => getFromHybrid<SiteContent>('/data', KEYS.CONTENT, FALLBACK_CONTENT, 'content');
export const saveSiteContent = (content: SiteContent) => saveToHybrid('/content', KEYS.CONTENT, content);

export const getTestimonials = () => getFromHybrid<Testimonial[]>('/data', KEYS.TESTIMONIALS, FALLBACK_TESTIMONIALS, 'testimonials');
export const saveTestimonials = (items: Testimonial[]) => saveToHybrid('/testimonials', KEYS.TESTIMONIALS, items);

export const getOrders = () => getFromHybrid<Order[]>('/data', KEYS.ORDERS, [], 'orders');
export const saveOrders = (items: Order[]) => saveToHybrid('/orders', KEYS.ORDERS, items);

// --- AUTH API ---
export const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const res = await fetchWithTimeout('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setLocal(KEYS.AUTH_PASS, password);
      return true;
    }
    return false;
  } catch (e) {
    const cached = getLocal<string>(KEYS.AUTH_PASS);
    return cached ? cached === password : password === 'admin123';
  }
};

export const updatePassword = async (password: string): Promise<boolean> => {
  setLocal(KEYS.AUTH_PASS, password);
  try {
    const res = await fetchWithTimeout('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.ok;
  } catch (e) {
    return false; 
  }
};