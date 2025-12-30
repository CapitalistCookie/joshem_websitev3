import React, { useEffect, useState } from 'react';
import { SectionProps, SiteContent } from '../types';
import { getSiteContent, FALLBACK_CONTENT } from '../services/storage';

const About: React.FC<SectionProps> = ({ id }) => {
  // START WITH FALLBACK IMMEDIATELY
  const [content, setContent] = useState<SiteContent['about']>(FALLBACK_CONTENT.about);

  useEffect(() => {
    const syncData = async () => {
        try {
            const data = await getSiteContent();
            if (data && data.about) {
                setContent(data.about);
            }
        } catch (e) {
            // Silently keep fallback
        }
    };
    syncData();
  }, []);

  return (
    <section id={id} className="py-20 bg-white relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Image Side */}
          <div className="w-full md:w-1/2 animate-fade-in-left">
            <div className="relative">
              <img 
                src={content.storyImage} 
                alt="Filipino Feast" 
                className="rounded-lg shadow-2xl z-10 relative w-full object-cover h-[400px]"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Our+Kitchen';
                }}
              />
              <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-[#36B1E5] rounded-lg -z-0 hidden md:block"></div>
            </div>
          </div>

          {/* Text Side */}
          <div className="w-full md:w-1/2 text-center md:text-left animate-fade-in-right" style={{ animationDelay: '200ms' }}>
            <h3 className="text-[#36B1E5] font-bold text-xl mb-2 uppercase tracking-wider">{content.title}</h3>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{content.storyTitle}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
              {content.storyText}
            </p>
            
            <div className="flex justify-center md:justify-start gap-8">
               <div className="text-center">
                 <span className="block text-4xl font-bold text-[#36B1E5]">15+</span>
                 <span className="text-gray-500 text-sm">Years Experience</span>
               </div>
               <div className="text-center">
                 <span className="block text-4xl font-bold text-[#36B1E5]">20+</span>
                 <span className="text-gray-500 text-sm">Unique Dishes</span>
               </div>
               <div className="text-center">
                 <span className="block text-4xl font-bold text-[#36B1E5]">100%</span>
                 <span className="text-gray-500 text-sm">Authentic</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;