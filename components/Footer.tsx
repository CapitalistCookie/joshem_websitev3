import React from 'react';
import Logo from './Logo';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1 flex flex-col items-start">
             <div className="flex items-center gap-2 mb-4">
                <Logo className="h-16 w-16" />
                <span className="font-script text-2xl text-[#36B1E5]">JoShem Foods</span>
             </div>
             <p className="text-gray-400 text-sm">Authentic Filipino flavors served with a smile. Catering for all occasions.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#hero" className="hover:text-[#36B1E5]">Home</a></li>
              <li><a href="#menu" className="hover:text-[#36B1E5]">Menu</a></li>
              <li><a href="#about" className="hover:text-[#36B1E5]">About Us</a></li>
              <li><a href="#contact" className="hover:text-[#36B1E5]">Contact</a></li>
              <li><Link to="/admin" className="hover:text-[#36B1E5]">Site Config</Link></li>
            </ul>
          </div>

          <div>
             <h3 className="font-bold text-lg mb-4">Social</h3>
             <div className="flex space-x-4">
               {/* Placeholders for social icons */}
               <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#36B1E5] transition-colors">FB</a>
               <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#36B1E5] transition-colors">IG</a>
               <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#36B1E5] transition-colors">TW</a>
             </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} JoShem Foods. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;