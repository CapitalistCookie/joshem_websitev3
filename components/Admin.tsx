import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, SiteContent, Testimonial } from '../types';
import { 
  getMenu, saveMenu, 
  getSiteContent, saveSiteContent,
  getTestimonials, saveTestimonials,
  checkServerHealth,
  FALLBACK_CONTENT
} from '../services/storage';
import { Link } from 'react-router-dom';

type Tab = 'menu' | 'content' | 'testimonials';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [isSaving, setIsSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [isServerLive, setIsServerLive] = useState<boolean | null>(null);

  // Data States
  const [items, setItems] = useState<MenuItem[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Drag and Drop State
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Forms State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '', description: '', price: 0, category: 'Main', image: ''
  });
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    name: '', text: '', rating: 5
  });

  useEffect(() => {
    const checkServer = async () => {
      const live = await checkServerHealth();
      setIsServerLive(live);
    };
    checkServer();

    if (isAuthenticated) {
      loadAllData();
    }

    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      const menu = await getMenu();
      const content = await getSiteContent();
      const reviews = await getTestimonials();

      setItems(menu);
      setTestimonials(reviews);
      
      setSiteContent({
        ...FALLBACK_CONTENT,
        ...content,
        about: { ...FALLBACK_CONTENT.about, ...content?.about },
        contact: { 
          ...FALLBACK_CONTENT.contact, 
          ...content?.contact,
          hours: { ...FALLBACK_CONTENT.contact.hours, ...content?.contact?.hours }
        }
      });
    } catch (e) {
      console.error("Data load failed", e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else alert('Incorrect password');
  };

  const triggerSave = async (fn: () => Promise<{success: boolean, synced: boolean}>) => {
    setIsSaving(true);
    try {
      const result = await fn();
      setIsSynced(result.synced);
    } catch (e) {
      setIsSynced(false);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const onDragStart = (index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };

  const onDragEnter = (index: number) => {
    dragOverItem.current = index;
    if (dragItem.current !== null && dragItem.current !== index) {
      const newItems = [...items];
      const draggedItemContent = newItems[dragItem.current];
      newItems.splice(dragItem.current, 1);
      newItems.splice(index, 0, draggedItemContent);
      dragItem.current = index;
      setDraggingIndex(index);
      setItems(newItems);
    }
  };

  const onDragEnd = () => {
    setDraggingIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;
    // Finalize and save the new order
    triggerSave(() => saveMenu(items));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    const itemToAdd: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name || '',
      description: newItem.description || '',
      price: Number(newItem.price),
      category: (newItem.category as any) || 'Main',
      image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
    };
    const updated = [...items, itemToAdd];
    setItems(updated);
    triggerSave(() => saveMenu(updated));
    setNewItem({ name: '', description: '', price: 0, category: 'Main', image: '' });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete item?')) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      triggerSave(() => saveMenu(updated));
    }
  };

  const handleContentSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (siteContent) {
      triggerSave(() => saveSiteContent(siteContent));
    }
  };

  const updateAbout = (field: keyof SiteContent['about'], value: string) => {
    if (!siteContent) return;
    setSiteContent({
      ...siteContent,
      about: { ...siteContent.about, [field]: value }
    });
  };

  const updateContact = (field: keyof SiteContent['contact'], value: string) => {
    if (!siteContent) return;
    setSiteContent({
      ...siteContent,
      contact: { ...siteContent.contact, [field]: value }
    });
  };

  const updateHours = (field: keyof SiteContent['contact']['hours'], value: string) => {
    if (!siteContent) return;
    setSiteContent({
      ...siteContent,
      contact: {
        ...siteContent.contact,
        hours: { ...siteContent.contact.hours, [field]: value }
      }
    });
  };

  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.name || !newTestimonial.text) return;
    const updated = [{
      id: Date.now(),
      name: newTestimonial.name || '',
      text: newTestimonial.text || '',
      rating: newTestimonial.rating || 5
    }, ...testimonials];
    setTestimonials(updated);
    triggerSave(() => saveTestimonials(updated));
    setNewTestimonial({ name: '', text: '', rating: 5 });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-[#36B1E5]">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#36B1E5]"
            placeholder="Enter Admin Password"
          />
          <button type="submit" className="w-full bg-[#36B1E5] text-white py-3 rounded-lg font-bold">Login</button>
          <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:text-blue-500">← Back to Site</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="bg-gray-900 text-white w-full md:w-64 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-script text-[#36B1E5]">Admin Panel</h1>
            <div className={`w-3 h-3 rounded-full ${isServerLive === null ? 'bg-gray-500' : isServerLive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} title={isServerLive ? "Server Online" : "Server Offline"}></div>
        </div>
        
        {!isServerLive && isServerLive !== null && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-200">
                <strong>Warning:</strong> Server unreachable. Syncing to local storage.
            </div>
        )}

        <nav className="flex-1 space-y-2">
          {['menu', 'content', 'testimonials'].map((tab) => (
            <button 
              key={tab} onClick={() => setActiveTab(tab as Tab)}
              className={`w-full text-left px-4 py-3 rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-[#36B1E5] text-white font-bold translate-x-1' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="mt-8 text-gray-400 hover:text-white border border-gray-700 py-2 rounded">Logout</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Status Indicator */}
          <div className="fixed top-6 right-6 flex flex-col gap-2 z-50">
            {isSaving && <div className="bg-yellow-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">↻ Saving...</div>}
            {!isSaving && !isSynced && <div className="bg-orange-500 text-white px-6 py-2 rounded-full shadow-lg animate-fade-in-up">⚠️ Saved Locally</div>}
            {!isSaving && isSynced && isServerLive && <div className="bg-green-600 text-white px-6 py-2 rounded-full shadow-lg animate-fade-in-up">✅ Cloud Synced</div>}
          </div>

          {activeTab === 'menu' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold">Menu Management</h2>
                    <p className="text-sm text-gray-400 mt-1">Drag items to reorder them on the main site.</p>
                  </div>
                  <p className="text-sm text-gray-500">{items.length} items total</p>
              </div>
              <form onSubmit={handleAddItem} className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-blue-400">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Item Name</label>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Price ($)</label>
                    <input type="number" step="0.01" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                    <select 
                      className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none bg-white" 
                      value={newItem.category || 'Main'} 
                      onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                    >
                      <option value="Main">Main</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Image URL</label>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" placeholder="https://image-link.com/photo.jpg" value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                    <textarea className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 outline-none" rows={2} value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-[#36B1E5] text-white py-3 rounded-lg font-bold hover:bg-blue-600 shadow-md transition-colors">Add to Menu</button>
              </form>

              <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    draggable 
                    onDragStart={() => onDragStart(index)}
                    onDragEnter={() => onDragEnter(index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center group cursor-move transition-all ${
                        draggingIndex === index 
                        ? 'opacity-40 border-dashed border-[#36B1E5] scale-[0.98]' 
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                        {/* Drag Handle Icon */}
                        <div className="text-gray-300 group-hover:text-gray-400">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 9h4V7h-4v2zm0 4h4v-2h-4v2zm0 4h4v-2h-4v2zm-4-8h4V7H6v2zm0 4h4v-2H6v2zm0 4h4v-2H6v2zm8-8h4V7h-4v2zm0 4h4v-2h-4v2zm0 4h4v-2h-4v2z" />
                          </svg>
                        </div>
                        <img src={item.image} className="w-12 h-12 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Food')} />
                        <div>
                          <h4 className="font-bold text-gray-800">{item.name}</h4>
                          <p className="text-xs text-[#36B1E5] font-bold">{item.category} • ${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && siteContent && (
            <div className="space-y-8 animate-fade-in-up">
               <h2 className="text-3xl font-bold">Site Content</h2>
               <form onSubmit={handleContentSave} className="space-y-6">
                {/* About Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-gray-900">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">About Story</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Section Tagline</label>
                          <input 
                            className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                            value={siteContent.about?.title || ''} 
                            onChange={e => updateAbout('title', e.target.value)} 
                          />
                      </div>
                      <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-400 uppercase">Subtitle (Italicized)</label>
                          <input 
                            className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none italic" 
                            value={siteContent.about?.subtitle || ''} 
                            onChange={e => updateAbout('subtitle', e.target.value)} 
                          />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Main Heading</label>
                        <input 
                          className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none font-bold" 
                          value={siteContent.about?.storyTitle || ''} 
                          onChange={e => updateAbout('storyTitle', e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Story Text</label>
                        <textarea 
                          className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                          rows={5} 
                          value={siteContent.about?.storyText || ''} 
                          onChange={e => updateAbout('storyText', e.target.value)} 
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Story Image URL</label>
                        <input 
                          className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                          value={siteContent.about?.storyImage || ''} 
                          onChange={e => updateAbout('storyImage', e.target.value)} 
                        />
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-[#36B1E5]">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Contact Info & Hours</h3>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Address</label>
                        <input 
                          className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                          value={siteContent.contact?.address || ''} 
                          onChange={e => updateContact('address', e.target.value)} 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                            <input 
                              className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                              value={siteContent.contact?.phone || ''} 
                              onChange={e => updateContact('phone', e.target.value)} 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                            <input 
                              className="border p-3 rounded focus:ring-2 focus:ring-blue-400 outline-none" 
                              value={siteContent.contact?.email || ''} 
                              onChange={e => updateContact('email', e.target.value)} 
                            />
                        </div>
                    </div>
                    
                    {/* Opening Hours */}
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Opening Hours</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Mon - Fri</label>
                          <input 
                            className="border p-2 text-sm rounded" 
                            value={siteContent.contact?.hours?.monFri || ''} 
                            onChange={e => updateHours('monFri', e.target.value)} 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Saturday</label>
                          <input 
                            className="border p-2 text-sm rounded" 
                            value={siteContent.contact?.hours?.sat || ''} 
                            onChange={e => updateHours('sat', e.target.value)} 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-400">Sunday</label>
                          <input 
                            className="border p-2 text-sm rounded" 
                            value={siteContent.contact?.hours?.sun || ''} 
                            onChange={e => updateHours('sun', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg">Save All Content</button>
              </form>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-3xl font-bold">Testimonials</h2>
              <form onSubmit={handleAddTestimonial} className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-yellow-400">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Customer Name</label>
                    <input placeholder="e.g. John Doe" className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newTestimonial.name || ''} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Review Text</label>
                    <textarea placeholder="Their experience..." className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newTestimonial.text || ''} onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-[#36B1E5] text-white py-3 rounded-lg font-bold hover:bg-blue-600 shadow-md">Post Testimonial</button>
              </form>
              <div className="space-y-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
                    <div className="flex text-yellow-400 mb-2">{'★'.repeat(t.rating)}</div>
                    <p className="italic text-gray-600">"{t.text}"</p>
                    <p className="text-sm font-bold mt-2">— {t.name}</p>
                    <button onClick={() => { if(window.confirm('Delete?')) { const up = testimonials.filter((_, idx) => idx !== i); setTestimonials(up); triggerSave(() => saveTestimonials(up)); }}} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;