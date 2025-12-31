import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { getSiteContent, FALLBACK_CONTENT } from '../services/storage';

const Hero: React.FC<{ id: string }> = ({ id }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [heroImages, setHeroImages] = useState(FALLBACK_CONTENT.hero.images);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSiteContent();
        if (data?.hero?.images) {
          setHeroImages(data.hero.images);
        }
      } catch (e) {
        console.error("Hero data load error", e);
      }
    };
    loadData();
  }, []);

  const visibleImages = heroImages.filter(img => img.visible);
  // Fallback if no images are visible
  const displayImages = visibleImages.length > 0 ? visibleImages : [FALLBACK_CONTENT.hero.images[0]];

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % displayImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayImages.length]);

  const scrollToMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="relative h-screen w-full overflow-hidden">
      {displayImages.map((img, index) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={img.url} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="animate-slide-up flex flex-col items-center">
           {/* Logo Component */}
           <div className="mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
             <Logo className="w-64 h-64 md:w-80 md:h-80" />
           </div>

           <h2 className="text-4xl md:text-6xl text-white font-bold mb-4 shadow-sm">
            Authentic Filipino Cuisine
           </h2>
           <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
             Bringing the warm hospitality and vibrant flavors of the Philippines straight to your plate.
           </p>
           <a
             href="#menu"
             onClick={scrollToMenu}
             className="bg-[#36B1E5] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-[#36B1E5] transition-all transform hover:scale-105 shadow-lg border-2 border-[#36B1E5] cursor-pointer"
           >
             View Menu
           </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;