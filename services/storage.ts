import { MenuItem, SiteContent, Testimonial } from '../types';

// --- STORAGE KEYS ---
const KEYS = {
  MENU: 'joshem_menu_data_v2',
  CONTENT: 'joshem_site_content_v2',
  TESTIMONIALS: 'joshem_testimonials_v2'
};

// --- RICH FALLBACK DATA ---
export const FALLBACK_MENU: MenuItem[] = [
    {
      id: '1',
      name: 'Chicken Adobo',
      description: 'The national dish. Chicken marinated in vinegar, soy sauce, garlic, and peppercorns, braised to savory perfection.',
      price: 13.99,
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '2',
      name: 'Lumpia Shanghai',
      description: 'Crispy fried spring rolls filled with savory ground pork, carrots, and onions. Served with sweet chili sauce.',
      price: 8.50,
      category: 'Appetizer',
      image: 'https://images.unsplash.com/photo-1626804475297-411dbe63c4df?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: '3',
      name: 'Sinigang na Baboy',
      description: 'A comforting sour tamarind soup with tender pork belly, kangkong (water spinach), and vegetables.',
      price: 15.50,
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1604579963283-f661759695d6?auto=format&fit=crop&q=80&w=800'
    }
];

export const FALLBACK_CONTENT: SiteContent = {
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
    { id: 2, name: "Ricardo Batungbakal", rating: 5, text: "The Lumpia Shanghai is incredibly crispy! I ordered 50 pieces for my son's birthday and they were gone in minutes. Highly recommend JoShem for any party catering." },
    { id: 3, name: "Jocelyn Dimagiba", rating: 4, text: "The Kare-Kare sauce is thick and savory, just the way it should be. The bagoong on the side was the perfect compliment. A bit of a wait for delivery, but worth it." },
    { id: 4, name: "Renato de Guzman", rating: 5, text: "I've tried many Filipino restaurants in the city, but JoShem captures the 'Puso' of our cooking. Their Sinigang is sour enough to make you blink—exactly how I like it!" },
    { id: 5, name: "Maria Elena Soriano", rating: 5, text: "We hired JoShem for our company's cultural day. The presentation was beautiful and the Lechon Kawali was still crunchy when it arrived. Five stars for service!" }
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
const fetchWithTimeout = async (url: string, options: RequestInit = {}, ms = 1500) => {
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
      if (result) {
        setLocal(localKey, result);
        return result;
      }
    }
  } catch (e) {
    console.info(`Sync ignored for ${apiPath} (Offline). Using Cache.`);
  }
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