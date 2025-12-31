import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navClass = `fixed w-full z-50 transition-all duration-300 ${
    scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
  }`;

  const textClass = scrolled ? 'text-gray-800' : 'text-white shadow-black drop-shadow-md';
  
  return (
    <nav className={navClass}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div 
            onClick={() => scrollToSection('hero')} 
            className="cursor-pointer flex items-center gap-2"
        >
            <Logo className="h-16 w-16 md:h-20 md:w-20 drop-shadow-lg" />
            <span className="sr-only">JoShem Foods</span> 
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 items-center">
          {['About', 'Menu', 'Testimonials', 'Contact'].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className={`font-semibold hover:text-[#36B1E5] transition-colors ${textClass}`}
            >
              {item}
            </button>
          ))}
          <Link
             to="/order"
             className="bg-[#36B1E5] text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-colors shadow-lg"
          >
            Order Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className={`focus:outline-none ${textClass}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white absolute w-full shadow-xl animate-fade-in-down">
          <div className="flex flex-col items-center py-4 space-y-4">
             {['About', 'Menu', 'Testimonials', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-gray-800 font-semibold text-lg hover:text-[#36B1E5]"
                >
                  {item}
                </button>
              ))}
             <Link
                to="/order"
                onClick={() => setIsOpen(false)}
                className="bg-[#36B1E5] text-white px-8 py-3 rounded-full font-bold"
             >
                Order Now
             </Link>
             <Link to="/admin" onClick={() => setIsOpen(false)} className="text-gray-400 text-sm mt-4">Site Config</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;