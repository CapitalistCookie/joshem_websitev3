export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Main' | 'Appetizer' | 'Dessert' | 'Drinks';
  image: string; // Base64 or URL
}

export interface SiteContent {
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