import React, { useState, useEffect } from 'react';
import { SectionProps, MenuItem } from '../types';
import { getMenu, FALLBACK_MENU } from '../services/storage';

const CATEGORIES = ['All', 'Main', 'Appetizer', 'Dessert', 'Drinks'];

const Menu: React.FC<SectionProps> = ({ id }) => {
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_MENU);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
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

  // Filter out invisible items first, then apply category filter
  const visibleItems = items.filter(item => item.visible !== false);

  const filteredItems = filter === 'All' 
    ? visibleItems 
    : visibleItems.filter(item => item.category === filter);

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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item, index) => {
            const hasSmall = (item.prices?.small || 0) > 0;
            const hasLarge = (item.prices?.large || 0) > 0;

            return (
              <div 
                  key={`${item.id}-${index}`} 
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group animate-fade-in-up relative ${
                    item.isDailySpecial ? 'ring-2 ring-yellow-400 scale-[1.02]' : ''
                  }`}
                  style={{ animationDelay: `${(index % 3) * 100}ms` }}
              >
              {item.isDailySpecial && (
                <div className="absolute top-0 left-0 bg-yellow-400 text-black font-bold text-[10px] px-3 py-1 rounded-br-lg z-20 shadow-sm uppercase tracking-widest">
                  Daily Special
                </div>
              )}

              <div className="h-56 overflow-hidden relative">
                  <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                  onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                  }}
                  />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    {hasSmall && (
                      <div className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 shadow-sm uppercase tracking-tighter">
                        S: <span className="text-[#36B1E5]">${item.prices.small.toFixed(2)}</span>
                      </div>
                    )}
                    {hasLarge && (
                      <div className="bg-white px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 shadow-sm uppercase tracking-tighter">
                        L: <span className="text-[#36B1E5]">${item.prices.large.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{item.description}</p>
                  <div className={`grid ${hasSmall && hasLarge ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-auto`}>
                     {hasSmall && (
                       <button className="bg-gray-100 text-gray-800 py-2 rounded text-xs font-bold hover:bg-[#36B1E5] hover:text-white transition-colors">
                         Add Small
                       </button>
                     )}
                     {hasLarge && (
                       <button className="bg-black text-white py-2 rounded text-xs font-bold hover:bg-[#36B1E5] transition-colors">
                         Add Large
                       </button>
                     )}
                  </div>
              </div>
              </div>
            );
        })}
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