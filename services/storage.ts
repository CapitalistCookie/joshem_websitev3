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
    }
};

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
    { id: 1, name: "Maria Santos", rating: 5, text: "Absolutely the best Filipino food I've had outside of Manila. The Adobo tastes just like home!" },
    { id: 2, name: "Ricardo Batungbakal", rating: 5, text: "The Lumpia Shanghai is incredibly crispy! I ordered 50 pieces for my son's birthday and they were gone in minutes. Highly recommend JoShem for any party catering." },
    { id: 3, name: "Jocelyn Dimagiba", rating: 4, text: "The Kare-Kare sauce is thick and savory, just the way it should be. The bagoong on the side was the perfect compliment. A bit of a wait for delivery, but worth it." },
    { id: 4, name: "Renato de Guzman", rating: 5, text: "I've tried many Filipino restaurants in the city, but JoShem captures the 'Puso' of our cooking. Their Sinigang is sour enough to make you blink—exactly how I like it!" },
    { id: 5, name: "Maria Elena Soriano", rating: 5, text: "We hired JoShem for our company's cultural day. The presentation was beautiful and the Lechon Kawali was still crunchy when it arrived. Five stars for service!" },
    { id: 6, name: "Danilo Panganiban", rating: 4, text: "Great portions for the price. The Halo-halo has so many ingredients, it's a meal on its own. I wish they had more seating, but the food is top-notch." },
    { id: 7, name: "Teresita Mercado", rating: 5, text: "The Pancit Bihon brought back so many memories of fiestas in the province. It's not too greasy and packed with fresh vegetables. My kids loved it too." },
    { id: 8, name: "Francisco Balagtas", rating: 5, text: "A poetic harmony of flavors. The sweetness of the spaghetti and the saltiness of the fried chicken is a combination only JoShem can perfect. Truly authentic." },
    { id: 9, name: "Imelda Ramos", rating: 5, text: "Everything was pristine. The packaging for our catering order was very professional and leak-proof. The Arroz Caldo was a lifesaver when I was feeling under the weather." },
    { id: 10, name: "Benigno Silverio", rating: 4, text: "Solid food and very friendly staff. The Sisig has a nice kick to it. I'll definitely be coming back to try the desserts next time." },
    { id: 11, name: "Gloria Evangelista", rating: 5, text: "They never fail to impress. I've ordered their Bilao of noodles multiple times for office meetings and it's always a hit with my colleagues of all backgrounds." },
    { id: 12, name: "Rodrigo Morales", rating: 5, text: "The Bulalo soup is rich and full of marrow. It's hard to find authentic soup like this. The beef was tender enough to eat with a spoon." },
    { id: 13, name: "Emmanuel Santos", rating: 5, text: "A knockout performance by the kitchen team! The Bicol Express had just the right amount of spice without being overwhelming. Best dinner I've had all week." },
    { id: 14, name: "Pia Alonzo", rating: 5, text: "Confidently delicious! Every bite feels like a warm hug from your Lola. The Cassava Cake is the best in the city, hands down." },
    { id: 15, name: "Catriona Magnayon", rating: 5, text: "Lava-hot and fresh! The delivery was faster than expected and the food quality didn't suffer. Their Dinuguan is surprisingly clean and very tasty." },
    { id: 16, name: "Efren Cruz", rating: 4, text: "Very good service. They accommodated my last-minute change to the catering menu without any hassle. The Garlic Rice is so aromatic!" },
    { id: 17, name: "Lea Chiongbian", rating: 5, text: "World-class flavors right in our neighborhood. The Kaldereta is rich and the meat is premium. It's clear they don't cut corners with their ingredients." },
    { id: 18, name: "Arnel Garcia", rating: 5, text: "Hits all the right notes! The BBQ skewers have that perfect char and sweet glaze. Reminds me of the street food back in the Philippines." },
    { id: 19, name: "Bamboo Soliman", rating: 4, text: "Unique twist on some classics. The Ube cheesecake is a must-try. The atmosphere in the shop is very welcoming and homey." },
    { id: 20, name: "Regine Valera", rating: 5, text: "Song-worthy flavors! I could sing praises about their Leche Flan all day. It's silky smooth and not overly sweet. Perfect ending to a meal." },
    { id: 21, name: "Vilma Singson", rating: 5, text: "Always a classic choice for our family Sunday dinners. Their menu has something for everyone, from the picky eaters to the adventurous ones." }
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