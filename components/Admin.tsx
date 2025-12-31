import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, SiteContent, Testimonial, HeroImage } from '../types';
import { 
  getMenu, saveMenu, 
  getSiteContent, saveSiteContent,
  getTestimonials, saveTestimonials,
  checkServerHealth,
  verifyPassword, updatePassword,
  FALLBACK_CONTENT
} from '../services/storage';
import { Link } from 'react-router-dom';

type Tab = 'menu' | 'content' | 'testimonials' | 'settings';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [isSaving, setIsSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [isServerLive, setIsServerLive] = useState<boolean | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Data States
  const [items, setItems] = useState<MenuItem[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Settings State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  // Drag and Drop State (Menu)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Drag and Drop State (Hero)
  const [draggingHeroIndex, setDraggingHeroIndex] = useState<number | null>(null);
  const dragHeroItem = useRef<number | null>(null);
  const dragHeroOverItem = useRef<number | null>(null);

  // Menu Edit State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Forms State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '', 
    description: '', 
    prices: { small: 0, large: 0 }, 
    category: 'Main', 
    image: '',
    visible: true,
    isDailySpecial: false
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
        hero: content?.hero || FALLBACK_CONTENT.hero,
        about: { ...FALLBACK_CONTENT.about, ...content?.about },
        contact: { 
          ...FALLBACK_CONTENT.contact, 
          ...content?.contact,
          hours: { ...FALLBACK_CONTENT.contact.hours, ...content?.contact?.hours }
        },
        socials: {
          ...FALLBACK_CONTENT.socials,
          ...content?.socials
        }
      });
    } catch (e) {
      console.error("Data load failed", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyPassword(password);
    if (isValid) setIsAuthenticated(true);
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

  // --- BULK ACTIONS ---
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const applyBulkAction = (action: 'hide' | 'show' | 'setSpecial' | 'removeSpecial' | 'delete') => {
    if (selectedIds.size === 0) return;
    
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.size} items?`)) return;

    let updated: MenuItem[];
    if (action === 'delete') {
      updated = items.filter(i => !selectedIds.has(i.id));
    } else {
      updated = items.map(i => {
        if (selectedIds.has(i.id)) {
          return {
            ...i,
            visible: action === 'hide' ? false : action === 'show' ? true : i.visible,
            isDailySpecial: action === 'setSpecial' ? true : action === 'removeSpecial' ? false : i.isDailySpecial
          };
        }
        return i;
      });
    }

    setItems(updated);
    triggerSave(() => saveMenu(updated));
    setSelectedIds(new Set());
  };

  // --- IMAGE HELPERS ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'menu' | 'hero' | 'about') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select a file under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (target === 'menu') {
        setNewItem(prev => ({ ...prev, image: result }));
      } else if (target === 'about') {
        updateAbout('storyImage', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveUrlImageLocally = async (url: string, callback: (data: string) => void) => {
    if (!url || url.startsWith('data:')) {
      alert("Please provide a valid external URL first.");
      return;
    }

    setIsProcessingImage(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
        setIsProcessingImage(false);
        alert("Image successfully downloaded and saved to local database!");
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to fetch image", error);
      alert("Could not fetch image due to CORS. Try uploading it instead.");
      setIsProcessingImage(false);
    }
  };

  // --- DRAG AND DROP (MENU) ---
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
    triggerSave(() => saveMenu(items));
  };

  // --- DRAG AND DROP (HERO) ---
  const onHeroDragStart = (index: number) => {
    dragHeroItem.current = index;
    setDraggingHeroIndex(index);
  };

  const onHeroDragEnter = (index: number) => {
    dragHeroOverItem.current = index;
    if (dragHeroItem.current !== null && dragHeroItem.current !== index && siteContent) {
      const newImages = [...siteContent.hero.images];
      const draggedItem = newImages[dragHeroItem.current];
      newImages.splice(dragHeroItem.current, 1);
      newImages.splice(index, 0, draggedItem);
      dragHeroItem.current = index;
      setDraggingHeroIndex(index);
      setSiteContent({ ...siteContent, hero: { images: newImages } });
    }
  };

  const onHeroDragEnd = () => {
    setDraggingHeroIndex(null);
    dragHeroItem.current = null;
    dragHeroOverItem.current = null;
  };

  const handleAddHeroImage = () => {
    if (!siteContent) return;
    const newHero: HeroImage = {
      id: `h-${Date.now()}`,
      url: '',
      visible: true
    };
    setSiteContent({
      ...siteContent,
      hero: { images: [...siteContent.hero.images, newHero] }
    });
  };

  const updateHeroImage = (index: number, field: keyof HeroImage, value: any) => {
    if (!siteContent) return;
    const newImages = [...siteContent.hero.images];
    newImages[index] = { ...newImages[index], [field]: value };
    setSiteContent({ ...siteContent, hero: { images: newImages } });
  };

  const deleteHeroImage = (index: number) => {
    if (!siteContent || !window.confirm('Remove this hero image?')) return;
    const newImages = [...siteContent.hero.images];
    newImages.splice(index, 1);
    setSiteContent({ ...siteContent, hero: { images: newImages } });
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !siteContent) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateHeroImage(index, 'url', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // --- MENU HANDLERS ---
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    let updated: MenuItem[];
    
    const finalItemData = {
      name: newItem.name || '',
      description: newItem.description || '',
      prices: {
          small: Number(newItem.prices?.small ?? 0),
          large: Number(newItem.prices?.large ?? 0)
      },
      category: (newItem.category as any) || 'Main',
      image: newItem.image || '',
      visible: newItem.visible !== false,
      isDailySpecial: !!newItem.isDailySpecial
    };

    if (editingItem) {
      updated = items.map(i => i.id === editingItem.id ? {
        ...editingItem,
        ...finalItemData
      } : i);
      setEditingItem(null);
    } else {
      const itemToAdd: MenuItem = {
        id: Date.now().toString(),
        ...finalItemData
      };
      updated = [...items, itemToAdd];
    }

    setItems(updated);
    triggerSave(() => saveMenu(updated));
    setNewItem({ 
      name: '', 
      description: '', 
      prices: { small: 0, large: 0 }, 
      category: 'Main', 
      image: '',
      visible: true,
      isDailySpecial: false
    });
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
        name: item.name,
        description: item.description,
        prices: {
            small: item.prices?.small ?? 0,
            large: item.prices?.large ?? 0
        },
        category: item.category,
        image: item.image,
        visible: item.visible !== false,
        isDailySpecial: !!item.isDailySpecial
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItem({ 
      name: '', 
      description: '', 
      prices: { small: 0, large: 0 }, 
      category: 'Main', 
      image: '',
      visible: true,
      isDailySpecial: false
    });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete item?')) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      triggerSave(() => saveMenu(updated));
    }
  };

  // --- CONTENT HANDLERS ---
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

  const updateSocials = (field: keyof SiteContent['socials'], value: string) => {
    if (!siteContent) return;
    setSiteContent({
      ...siteContent,
      socials: { ...siteContent.socials, [field]: value }
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || !confirmPass) return alert("Please enter a password.");
    if (newPass !== confirmPass) return alert("Passwords do not match.");
    if (newPass.length < 5) return alert("Password too short.");
    
    const success = await updatePassword(newPass);
    if (success) {
        alert("Password updated successfully!");
        setNewPass('');
        setConfirmPass('');
    }
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
        
        <nav className="flex-1 space-y-2">
          {['menu', 'content', 'testimonials', 'settings'].map((tab) => (
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
                  <h2 className="text-3xl font-bold">{editingItem ? 'Edit Menu Item' : 'Menu Management'}</h2>
                  <p className="text-sm text-gray-500">{items.length} items total</p>
              </div>
              <form onSubmit={handleSaveItem} className={`bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 transition-all ${editingItem ? 'border-yellow-400' : 'border-blue-400'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Item Name</label>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                    <select className="border p-2 rounded outline-none" value={newItem.category || 'Main'} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                      <option value="Main">Main</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Small Price ($)</label>
                        <input type="number" step="0.5" min="0" className="border p-2 rounded outline-none" value={newItem.prices?.small ?? ''} onChange={e => setNewItem({...newItem, prices: { ...newItem.prices!, small: e.target.value === '' ? 0 : parseFloat(e.target.value) }})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Large Price ($)</label>
                        <input type="number" step="0.5" min="0" className="border p-2 rounded outline-none" value={newItem.prices?.large ?? ''} onChange={e => setNewItem({...newItem, prices: { ...newItem.prices!, large: e.target.value === '' ? 0 : parseFloat(e.target.value) }})} />
                    </div>
                </div>

                {/* VISIBILITY AND SPECIAL FLAGS */}
                <div className="flex gap-8 py-2 bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-[#36B1E5] focus:ring-[#36B1E5]"
                          checked={newItem.visible !== false} 
                          onChange={e => setNewItem({...newItem, visible: e.target.checked})} 
                        />
                        <span className="text-sm font-bold text-gray-700">Show on Menu</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-500"
                          checked={!!newItem.isDailySpecial} 
                          onChange={e => setNewItem({...newItem, isDailySpecial: e.target.checked})} 
                        />
                        <span className="text-sm font-bold text-gray-700">Daily Special Highlight</span>
                    </label>
                </div>

                {/* IMAGE MANAGEMENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Upload Image</label>
                            <input type="file" accept="image/*" className="text-sm cursor-pointer" onChange={(e) => handleFileUpload(e, 'menu')} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Or Image URL</label>
                            <div className="flex gap-2">
                                <input className="flex-1 border p-2 rounded text-sm outline-none" placeholder="https://..." value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                                {newItem.image && !newItem.image.startsWith('data:') && (
                                    <button type="button" onClick={() => saveUrlImageLocally(newItem.image!, data => setNewItem({...newItem, image: data}))} className="px-3 py-2 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200">Save locally</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-32 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                        {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover" /> : <span className="text-gray-300 text-xs italic">No image</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                    <textarea className="border p-2 rounded outline-none" rows={2} value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div className="flex gap-4">
                    <button type="submit" className={`flex-1 py-3 rounded-lg font-bold text-white shadow-md transition-all ${editingItem ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-[#36B1E5] hover:bg-blue-600'}`}>
                        {editingItem ? 'Save Changes' : 'Add to Menu'}
                    </button>
                    {editingItem && <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition-all">Cancel</button>}
                </div>
              </form>

              {/* MASS ACTIONS BAR */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-300 text-[#36B1E5] focus:ring-[#36B1E5]"
                      checked={selectedIds.size > 0 && selectedIds.size === items.length}
                      onChange={toggleSelectAll}
                    />
                    <span className="font-bold text-gray-700">Select All</span>
                  </label>
                  {selectedIds.size > 0 && (
                    <span className="bg-[#36B1E5] text-white text-[10px] px-2 py-1 rounded-full font-bold">
                      {selectedIds.size} Selected
                    </span>
                  )}
                </div>
                
                {selectedIds.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => applyBulkAction('show')} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-green-600 hover:bg-white rounded transition-all">Show All</button>
                      <button onClick={() => applyBulkAction('hide')} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-red-600 hover:bg-white rounded transition-all">Hide All</button>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => applyBulkAction('setSpecial')} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-yellow-600 hover:bg-white rounded transition-all">Set Special</button>
                      <button onClick={() => applyBulkAction('removeSpecial')} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-all">Remove Special</button>
                    </div>
                    <button onClick={() => applyBulkAction('delete')} className="bg-red-50 text-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-red-100 hover:bg-red-600 hover:text-white transition-all">Delete</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {items.map((item, index) => (
                  <div 
                    key={item.id} draggable onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
                    className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center group cursor-move transition-all ${draggingIndex === index ? 'opacity-40 border-dashed border-[#36B1E5]' : 'border-gray-100 hover:border-blue-200'} ${editingItem?.id === item.id ? 'ring-2 ring-yellow-400' : ''} ${!item.visible ? 'bg-gray-50 grayscale' : ''} ${selectedIds.has(item.id) ? 'bg-blue-50/50 border-blue-200' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-gray-300 text-[#36B1E5] focus:ring-[#36B1E5] cursor-pointer"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.id);
                          }}
                        />
                        <img src={item.image} className="w-12 h-12 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Food')} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                            {!item.visible && <span className="bg-gray-200 text-gray-600 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Hidden</span>}
                            {item.isDailySpecial && <span className="bg-yellow-400 text-black text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Special</span>}
                          </div>
                          <p className="text-[10px] text-[#36B1E5] font-bold uppercase tracking-widest">{item.category}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditItem(item)} className="text-yellow-500 hover:text-yellow-700 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-600 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && siteContent && (
            <div className="space-y-8 animate-fade-in-up">
               <h2 className="text-3xl font-bold">Site Content</h2>
               <form onSubmit={handleContentSave} className="space-y-8">
                
                {/* Hero Carousel Management */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Hero Carousel</h3>
                        <button type="button" onClick={handleAddHeroImage} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded font-bold hover:bg-yellow-200 transition-colors">Add Image</button>
                    </div>
                    <div className="space-y-4">
                        {siteContent.hero.images.map((hImg, idx) => (
                            <div 
                              key={hImg.id} 
                              draggable onDragStart={() => onHeroDragStart(idx)} onDragEnter={() => onHeroDragEnter(idx)} onDragEnd={onHeroDragEnd} onDragOver={e => e.preventDefault()}
                              className={`border rounded-lg p-4 bg-gray-50 flex flex-col md:flex-row gap-4 items-center cursor-move transition-all ${draggingHeroIndex === idx ? 'opacity-30 border-dashed border-yellow-400' : 'border-gray-200 hover:border-yellow-200'}`}
                            >
                                <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0 shadow-inner">
                                    <img src={hImg.url} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/100?text=?')} />
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <input 
                                        className="w-full border p-2 text-xs rounded outline-none focus:ring-1 focus:ring-yellow-400" 
                                        placeholder="Image URL" 
                                        value={hImg.url} 
                                        onChange={e => updateHeroImage(idx, 'url', e.target.value)} 
                                    />
                                    <div className="flex items-center gap-4">
                                        <input type="file" accept="image/*" className="text-[10px] cursor-pointer" onChange={e => handleHeroFileUpload(e, idx)} />
                                        <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                            <input type="checkbox" className="rounded" checked={hImg.visible} onChange={e => updateHeroImage(idx, 'visible', e.target.checked)} />
                                            Visible
                                        </label>
                                    </div>
                                </div>
                                <button type="button" onClick={() => deleteHeroImage(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-gray-900">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">About Story</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border p-3 rounded outline-none focus:ring-1 focus:ring-gray-900" placeholder="Tagline" value={siteContent.about?.title || ''} onChange={e => updateAbout('title', e.target.value)} />
                        <input className="border p-3 rounded outline-none italic focus:ring-1 focus:ring-gray-900" placeholder="Subtitle" value={siteContent.about?.subtitle || ''} onChange={e => updateAbout('subtitle', e.target.value)} />
                    </div>
                    <input className="w-full border p-3 rounded font-bold outline-none focus:ring-1 focus:ring-gray-900" placeholder="Heading" value={siteContent.about?.storyTitle || ''} onChange={e => updateAbout('storyTitle', e.target.value)} />
                    <textarea className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-gray-900" rows={5} placeholder="Story text" value={siteContent.about?.storyText || ''} onChange={e => updateAbout('storyText', e.target.value)} />
                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                        <input className="flex-1 border p-3 rounded outline-none text-xs focus:ring-1 focus:ring-gray-900" placeholder="Image URL" value={siteContent.about?.storyImage || ''} onChange={e => updateAbout('storyImage', e.target.value)} />
                        <input type="file" accept="image/*" className="text-xs cursor-pointer" onChange={e => handleFileUpload(e, 'about')} />
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-[#36B1E5]">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Contact & Hours</h3>
                    <input className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-[#36B1E5]" placeholder="Address" value={siteContent.contact?.address || ''} onChange={e => updateContact('address', e.target.value)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border p-3 rounded outline-none focus:ring-1 focus:ring-[#36B1E5]" placeholder="Phone" value={siteContent.contact?.phone || ''} onChange={e => updateContact('phone', e.target.value)} />
                        <input className="border p-3 rounded outline-none focus:ring-1 focus:ring-[#36B1E5]" placeholder="Email" value={siteContent.contact?.email || ''} onChange={e => updateContact('email', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                        <input className="border p-2 text-xs focus:ring-1 focus:ring-[#36B1E5]" placeholder="Mon-Fri" value={siteContent.contact?.hours?.monFri || ''} onChange={e => updateHours('monFri', e.target.value)} />
                        <input className="border p-2 text-xs focus:ring-1 focus:ring-[#36B1E5]" placeholder="Saturday" value={siteContent.contact?.hours?.sat || ''} onChange={e => updateHours('sat', e.target.value)} />
                        <input className="border p-2 text-xs focus:ring-1 focus:ring-[#36B1E5]" placeholder="Sunday" value={siteContent.contact?.hours?.sun || ''} onChange={e => updateHours('sun', e.target.value)} />
                    </div>
                </div>

                {/* Socials Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-pink-400">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input className="border p-3 text-xs focus:ring-1 focus:ring-pink-400" placeholder="Facebook URL" value={siteContent.socials?.facebook || ''} onChange={e => updateSocials('facebook', e.target.value)} />
                        <input className="border p-3 text-xs focus:ring-1 focus:ring-pink-400" placeholder="Instagram URL" value={siteContent.socials?.instagram || ''} onChange={e => updateSocials('instagram', e.target.value)} />
                        <input className="border p-3 text-xs focus:ring-1 focus:ring-pink-400" placeholder="Twitter URL" value={siteContent.socials?.twitter || ''} onChange={e => updateSocials('twitter', e.target.value)} />
                    </div>
                </div>

                <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-colors">Save All Content</button>
              </form>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="text-3xl font-bold">Testimonials</h2>
              <form onSubmit={handleAddTestimonial} className="bg-white p-6 rounded-xl shadow-sm space-y-4 border-l-4 border-yellow-400">
                <input placeholder="Customer Name" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-yellow-400" value={newTestimonial.name || ''} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} />
                <textarea placeholder="Review" className="w-full border p-2 rounded outline-none focus:ring-1 focus:ring-yellow-400" value={newTestimonial.text || ''} onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})} />
                <button type="submit" className="w-full bg-[#36B1E5] text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">Post Testimonial</button>
              </form>
              <div className="space-y-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group transition-all hover:border-yellow-200">
                    <p className="italic text-gray-600">"{t.text}"</p>
                    <p className="text-sm font-bold mt-2">— {t.name}</p>
                    <button onClick={() => { if(window.confirm('Delete?')) { const up = testimonials.filter((_, idx) => idx !== i); setTestimonials(up); triggerSave(() => saveTestimonials(up)); }}} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in-up">
                <h2 className="text-3xl font-bold">Settings</h2>
                <div className="bg-white p-6 rounded-xl border-l-4 border-purple-500">
                    <h3 className="font-bold mb-4">Update Password</h3>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <input type="password" placeholder="New Password" className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-purple-500" value={newPass} onChange={e => setNewPass(e.target.value)} />
                        <input type="password" placeholder="Confirm Password" className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-purple-500" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                        <button type="submit" className="bg-purple-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-purple-700 transition-colors">Update</button>
                    </form>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;