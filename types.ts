export interface HeroImage {
  id: string;
  url: string;
  visible: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  prices: {
    small: number;
    large: number;
  };
  category: 'Main' | 'Appetizer' | 'Dessert' | 'Drinks';
  image: string; // Base64 or URL
  visible: boolean;
  isDailySpecial: boolean;
}

export interface OrderItem {
  itemId: string;
  name: string;
  size: 'small' | 'large';
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  pickupTime: string;
  allergens: string;
  comments: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface SiteContent {
  hero: {
    images: HeroImage[];
  };
  about: {
    title: string;
    subtitle: string;
    storyTitle: string;
    storyText: string;
    storyImage: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    hours: {
      monFri: string;
      sat: string;
      sun: string;
    };
  };
  socials: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

export interface Testimonial {
  id: number | string;
  name: string;
  text: string;
  rating: number;
}

export interface SectionProps {
  id: string;
}