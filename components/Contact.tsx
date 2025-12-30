import React, { useEffect, useState } from 'react';
import { SectionProps, SiteContent } from '../types';
import { getSiteContent } from '../services/storage';

// Component for displaying contact information and a map
const Contact: React.FC<SectionProps> = ({ id }) => {
  const [content, setContent] = useState<SiteContent['contact'] | null>(null);

  useEffect(() => {
    const loadData = async () => {
        const data = await getSiteContent();
        setContent(data.contact);
    };
    loadData();
  }, []);

  if (!content) return null;

  // Dynamically generate the map URL based on the address
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(content.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address)}`;

  return (
    <section id={id} className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Side */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Visit Us</h2>
            <p className="text-gray-600 mb-8">
              We are located in the heart of the city. Come dine with us or pick up a catering order for your next event.
            </p>

            <div className="space-y-6">
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-4 group transition-all"
              >
                <div className="bg-[#36B1E5] p-3 rounded-full text-white group-hover:bg-black transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Address</h4>
                  <p className="text-gray-600 group-hover:text-[#36B1E5] transition-colors">{content.address}</p>
                </div>
              </a>

              <a 
                href={`tel:${content.phone.replace(/\D/g, '')}`} 
                className="flex items-center gap-4 group transition-all"
              >
                <div className="bg-[#36B1E5] p-3 rounded-full text-white group-hover:bg-black transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Phone</h4>
                  <p className="text-gray-600 group-hover:text-[#36B1E5] transition-colors">{content.phone}</p>
                </div>
              </a>

              <a 
                href={`mailto:${content.email}`} 
                className="flex items-center gap-4 group transition-all"
              >
                <div className="bg-[#36B1E5] p-3 rounded-full text-white group-hover:bg-black transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Email</h4>
                  <p className="text-gray-600 group-hover:text-[#36B1E5] transition-colors">{content.email}</p>
                </div>
              </a>
            </div>

            <div className="mt-10">
              <h4 className="font-bold text-lg mb-4">Opening Hours</h4>
              <table className="w-full text-left text-gray-600">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Mon - Fri</td>
                    <td className="py-2 font-medium">{content.hours?.monFri || '10:00 AM - 9:00 PM'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Saturday</td>
                    <td className="py-2 font-medium">{content.hours?.sat || '11:00 AM - 10:00 PM'}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Sunday</td>
                    <td className="py-2 font-medium">{content.hours?.sun || 'Closed'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Map Side */}
          <div className="h-96 lg:h-auto bg-gray-200 rounded-xl overflow-hidden shadow-lg border-2 border-gray-100">
             <iframe 
               title="Map"
               src={mapSrc}
               width="100%" 
               height="450px"
               style={{ border: 0 }}
               allowFullScreen
               loading="lazy"
               referrerPolicy="no-referrer-when-downgrade"
             ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;