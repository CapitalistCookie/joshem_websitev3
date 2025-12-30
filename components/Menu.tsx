import React, { useState, useEffect } from 'react';
import { SectionProps, MenuItem } from '../types';
import { getMenu, FALLBACK_MENU } from '../services/storage';

const CATEGORIES = ['All', 'Main', 'Appetizer', 'Dessert', 'Drinks'];

const Menu: React.FC<SectionProps> = ({ id }) => {
  // START WITH FALLBACK DATA IMMEDIATELY
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_MENU);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // Attempt to sync with backend in background
    const syncData = async () => {
        try {
            const data = await getMenu();
            if (data && data.length > 0) {
              setItems(data);
            }
        } catch (error) {
            // Silently keep fallback data
        }
    };
    syncData();
  }, []);

  const filteredItems = filter === 'All' 
    ? items 
    : items.filter(item => item.category === filter);

  return (
    <section id={id} className="py-20 bg-gray-50 relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Explore our diverse selection of savory classics and sweet treats.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                filter === cat 
                  ? 'bg-[#36B1E5] text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid - No Loading State Needed as we have Fallback */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item, index) => (
            <div 
                key={`${item.id}-${index}`} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col group animate-fade-in-up"
                style={{ animationDelay: `${(index % 3) * 100}ms` }}
            >
            <div className="h-56 overflow-hidden relative">
                <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                }}
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold text-[#36B1E5] shadow-sm">
                ${item.price.toFixed(2)}
                </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-1">{item.description}</p>
                <button className="w-full mt-auto bg-black text-white py-2 rounded hover:bg-[#36B1E5] transition-colors">
                Add to Order
                </button>
            </div>
            </div>
        ))}
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-500 animate-fade-in-up">
            No items found in this category.
          </div>
        )}
      </div>
    </section>
  );
};

export default Menu;