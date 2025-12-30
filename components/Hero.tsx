import React, { useState, useEffect } from 'react';
import Logo from './Logo';

const IMAGES = [
  "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=1920", // Tropical
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1920", // Food BBQ
  "https://images.unsplash.com/photo-1534944923498-84e45eb3dbf4?auto=format&fit=crop&q=80&w=1920"  // Landscape
];

const Hero: React.FC<{ id: string }> = ({ id }) => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id={id} className="relative h-screen w-full overflow-hidden">
      {IMAGES.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={img} alt="Hero" className="w-full h-full object-cover" />
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