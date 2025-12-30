import React, { useEffect, useState } from 'react';
import { SectionProps, Testimonial } from '../types';
import { getTestimonials, FALLBACK_TESTIMONIALS } from '../services/storage';

const Testimonials: React.FC<SectionProps> = ({ id }) => {
  // START WITH FALLBACK IMMEDIATELY
  const [reviews, setReviews] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    const syncData = async () => {
        try {
            const data = await getTestimonials();
            if (data && data.length > 0) {
              setReviews(data);
            }
        } catch (e) {
            // Silently keep fallback
        }
    };
    syncData();
  }, []);

  const marqueeItems = [...reviews, ...reviews];

  return (
    <section id={id} className="py-24 bg-[#36B1E5] overflow-hidden relative">
      <div className="container mx-auto px-6 text-center mb-16 relative z-10 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-sm">Kain Na! (Let's Eat!)</h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            See why our community loves dining with us. Authentic flavors, served with a smile.
          </p>
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#36B1E5] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#36B1E5] to-transparent z-10 pointer-events-none"></div>

      <div className="animate-fade-in-up relative z-10" style={{ animationDelay: '200ms' }}>
        <div className="flex w-max animate-marquee pause-on-hover gap-8 pl-8">
          {marqueeItems.map((review, index) => (
            <div 
              key={`${review.id}-${index}`} 
              className="w-[350px] md:w-[400px] bg-white p-8 rounded-xl shadow-lg flex flex-col flex-shrink-0 border-b-4 border-blue-300 transform transition-transform hover:-translate-y-1"
            >
              <div className="flex text-yellow-400 mb-4 text-lg">
                {'★'.repeat(review.rating)}
              </div>
              
              <div className="flex-1 mb-6">
                 <span className="text-4xl text-gray-200 font-serif leading-none">“</span>
                 <p className="text-gray-700 italic -mt-4 relative z-10 pl-4">{review.text}</p>
              </div>

              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center font-bold text-[#36B1E5] text-xl">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{review.name}</h4>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Food Lover</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;