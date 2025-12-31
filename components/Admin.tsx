import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, SiteContent, Testimonial, HeroImage, Order, OrderStatus } from '../types';
import { 
  getMenu, saveMenu, 
  getSiteContent, saveSiteContent,
  getTestimonials, saveTestimonials,
  getOrders, saveOrders,
  checkServerHealth,
  verifyPassword, updatePassword,
  FALLBACK_CONTENT,
  FALLBACK_MENU,
  FALLBACK_TESTIMONIALS
} from '../services/storage';
import { Link } from 'react-router-dom';

type Tab = 'menu' | 'orders' | 'content' | 'testimonials' | 'settings';
type OrderView = 'active' | 'archive';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orderView, setOrderView] = useState<OrderView>('active');
  const [isSaving, setIsSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [isServerLive, setIsServerLive] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Data States
  const [items, setItems] = useState<MenuItem[]>(FALLBACK_MENU);
  const [siteContent, setSiteContent] = useState<SiteContent>(FALLBACK_CONTENT);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Editing state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '', description: '', prices: { small: 0, large: 0 }, category: 'Main', image: '', visible: true, isDailySpecial: false
  });
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({ name: '', text: '', rating: 5 });

  useEffect(() => {
    const checkServer = async () => {
      const live = await checkServerHealth();
      setIsServerLive(live);
    };
    checkServer();
    if (isAuthenticated) loadAllData();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      const [menu, content, reviews, ords] = await Promise.all([
        getMenu(), getSiteContent(), getTestimonials(), getOrders()
      ]);
      
      if (menu?.length) setItems(menu);
      if (reviews?.length) setTestimonials(reviews);
      if (ords) setOrders(ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      // Deep merge settings to ensure new fields like minPrepTime appear even if DB is old
      if (content) {
        setSiteContent({
          ...FALLBACK_CONTENT,
          ...content,
          settings: {
            ...FALLBACK_CONTENT.settings,
            ...(content.settings || {})
          },
          hero: content.hero || FALLBACK_CONTENT.hero,
          about: { ...FALLBACK_CONTENT.about, ...content.about },
          contact: { ...FALLBACK_CONTENT.contact, ...content.contact },
          socials: { ...FALLBACK_CONTENT.socials, ...content.socials }
        });
      }
    } catch (e) { console.error("Data load failed", e); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await verifyPassword(password)) setIsAuthenticated(true);
    else alert('Incorrect password');
  };

  const triggerSave = async (fn: () => Promise<{success: boolean, synced: boolean}>) => {
    setIsSaving(true);
    try {
      const result = await fn();
      setIsSynced(result.synced);
    } finally { setTimeout(() => setIsSaving(false), 800); }
  };

  // --- ORDER LOGIC ---
  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled'), [orders]);
  const archivedOrders = useMemo(() => orders.filter(o => o.status === 'completed' || o.status === 'cancelled'), [orders]);
  
  const currentOrders = orderView === 'active' ? activeOrders : archivedOrders;
  
  const filteredOrders = useMemo(() => {
    let list = [...currentOrders];
    if (selectedDate) {
      list = list.filter(o => new Date(o.pickupTime).toDateString() === selectedDate);
    }
    return list;
  }, [currentOrders, selectedDate]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = -5; i < 20; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const count = orders.filter(o => 
        (o.status !== 'cancelled') && 
        new Date(o.pickupTime).toDateString() === d.toDateString()
      ).length;
      days.push({ 
        date: d.toDateString(), 
        label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), 
        count 
      });
    }
    return days;
  }, [orders]);

  const getSimultaneousOrders = (order: Order) => {
    const orderTime = new Date(order.pickupTime).getTime();
    return orders.filter(o => {
      if (o.id === order.id || o.status === 'cancelled' || o.status === 'completed') return false;
      const otherTime = new Date(o.pickupTime).getTime();
      return Math.abs(orderTime - otherTime) < 30 * 60 * 1000; // 30 mins window
    });
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    triggerSave(() => saveOrders(updated));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="bg-gray-900 text-white w-full md:w-64 p-6 flex flex-col sticky top-0 h-auto md:h-screen">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-script text-[#36B1E5]">JoShem Admin</h1>
            <div className={`w-2 h-2 rounded-full ${isServerLive ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-red-500'}`}></div>
        </div>
        <nav className="flex-1 space-y-1">
          {['orders', 'menu', 'content', 'testimonials', 'settings'].map((tab) => (
            <button 
              key={tab} onClick={() => setActiveTab(tab as Tab)}
              className={`w-full text-left px-4 py-2.5 rounded-lg capitalize transition-all text-sm ${activeTab === tab ? 'bg-[#36B1E5] text-white font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="mt-8 text-gray-500 text-xs hover:text-white border border-gray-800 py-2 rounded">Sign Out</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in-up">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Orders Dashboard</h2>
                  <div className="flex gap-4 mt-2">
                    <button 
                      onClick={() => setOrderView('active')} 
                      className={`text-sm font-bold pb-1 border-b-2 transition-all ${orderView === 'active' ? 'border-[#36B1E5] text-[#36B1E5]' : 'border-transparent text-gray-400'}`}
                    >
                      Active ({activeOrders.length})
                    </button>
                    <button 
                      onClick={() => setOrderView('archive')} 
                      className={`text-sm font-bold pb-1 border-b-2 transition-all ${orderView === 'archive' ? 'border-gray-500 text-gray-600' : 'border-transparent text-gray-400'}`}
                    >
                      Archive ({archivedOrders.length})
                    </button>
                  </div>
                </div>
              </header>

              {/* Calendar Heatmap */}
              <div className="bg-white p-4 rounded-2xl border shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!selectedDate ? 'bg-[#36B1E5] text-white border-[#36B1E5]' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
                  >
                    All Days
                  </button>
                  {calendarDays.map((day) => (
                    <button 
                      key={day.date}
                      onClick={() => setSelectedDate(day.date === selectedDate ? null : day.date)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center min-w-[90px] ${
                        selectedDate === day.date 
                        ? 'bg-black text-white border-black shadow-lg scale-105' 
                        : day.count > 0 
                          ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' 
                          : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mb-1">{day.label}</span>
                      <div className="flex gap-1 items-center">
                        <span className={`w-1.5 h-1.5 rounded-full ${day.count > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'}`}></span>
                        <span className="text-[10px] uppercase">{day.count} {day.count === 1 ? 'Ord' : 'Ords'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact High-Density Order Cards */}
              <div className="grid grid-cols-1 gap-3">
                {filteredOrders.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                    No {orderView} orders found.
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const simOrders = getSimultaneousOrders(order);
                    return (
                      <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                          {/* Col 1: Status & Info */}
                          <div className="flex items-center gap-3 w-full md:w-1/4">
                            <div className={`w-1.5 h-12 rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-400' :
                              order.status === 'confirmed' ? 'bg-blue-400' :
                              order.status === 'ready' ? 'bg-green-500' :
                              order.status === 'completed' ? 'bg-gray-200' :
                              'bg-red-400'
                            }`}></div>
                            <div className="overflow-hidden">
                              <div className="text-[9px] font-mono text-gray-300 uppercase truncate">ID: {order.id.split('-')[1]}</div>
                              <div className="font-bold text-gray-900 text-sm truncate">{order.customerName}</div>
                              <div className="flex items-center gap-1.5">
                                <a href={`tel:${order.phone}`} className="text-[10px] text-gray-400 hover:text-[#36B1E5]">{order.phone}</a>
                                <span className="text-gray-200">|</span>
                                <a href={`mailto:${order.email}`} className="text-[10px] text-gray-400 hover:text-[#36B1E5] truncate">{order.email}</a>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Pickup Timing */}
                          <div className="w-full md:w-1/4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">
                                {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(order.pickupTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {simOrders.length > 0 && order.status !== 'completed' && order.status !== 'cancelled' && (
                              <div className="relative group/tooltip inline-block">
                                <div className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1 mt-1 cursor-help animate-pulse">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  +{simOrders.length} conflict
                                </div>
                                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-2xl invisible group-hover/tooltip:visible">
                                  Other orders at similar time:
                                  {simOrders.map(o => (
                                    <div key={o.id} className="mt-1 flex justify-between border-t border-gray-700 pt-1">
                                      <span>{o.customerName}</span>
                                      <span>{new Date(o.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Col 3: Items Mini-summary */}
                          <div className="w-full md:w-1/4 text-[10px] text-gray-500 flex flex-wrap gap-1">
                            {order.items.map((it, idx) => (
                              <span key={idx} className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {it.quantity}x {it.name}
                              </span>
                            ))}
                          </div>

                          {/* Col 4: Total & Status Control */}
                          <div className="w-full md:w-1/4 flex items-center justify-between md:justify-end gap-3">
                            <div className="text-right">
                              <div className="text-[9px] text-gray-400 uppercase font-bold">Total</div>
                              <div className="text-sm font-black text-[#36B1E5]">${order.total.toFixed(2)}</div>
                            </div>
                            <select 
                              value={order.status} 
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="text-[10px] font-bold bg-gray-100 border-none rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-[#36B1E5] cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Complete</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                            <button onClick={() => { if(window.confirm('Delete this order permanently?')) setOrders(orders.filter(o => o.id !== order.id)) }} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>
                        {/* Expanded details (visible if comments exist) */}
                        {order.comments && (
                          <div className="px-4 pb-3 border-t border-gray-50 pt-2 flex items-center gap-2">
                            <span className="text-[9px] font-black text-blue-400 uppercase">Note:</span>
                            <p className="text-[10px] text-gray-500 italic">{order.comments}</p>
                          </div>
                        )}
                        {order.allergens && (
                          <div className="px-4 pb-3 flex items-center gap-2">
                            <span className="text-[9px] font-black text-red-400 uppercase">Allergy Alert:</span>
                            <p className="text-[10px] text-red-600 font-bold">{order.allergens}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-end">
                  <h2 className="text-3xl font-bold">{editingItem ? 'Edit Menu Item' : 'Menu Management'}</h2>
                  <p className="text-sm text-gray-500">{items.length} items total</p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newItem.name) return;
                const final = {
                  id: editingItem?.id || Date.now().toString(),
                  name: newItem.name || '',
                  description: newItem.description || '',
                  prices: { small: Number(newItem.prices?.small || 0), large: Number(newItem.prices?.large || 0) },
                  category: (newItem.category as any) || 'Main',
                  image: newItem.image || '',
                  visible: newItem.visible !== false,
                  isDailySpecial: !!newItem.isDailySpecial
                };
                const updated = editingItem ? items.map(i => i.id === final.id ? final : i) : [...items, final];
                setItems(updated);
                triggerSave(() => saveMenu(updated));
                setEditingItem(null);
                setNewItem({ name: '', description: '', prices: { small: 0, large: 0 }, category: 'Main', image: '', visible: true, isDailySpecial: false });
              }} className={`bg-white p-6 rounded-2xl shadow-sm space-y-4 border-l-4 transition-all ${editingItem ? 'border-yellow-400' : 'border-blue-400'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Item Name</label>
                    <input className="border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                    <select className="border p-2 rounded-lg text-sm outline-none" value={newItem.category || 'Main'} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                      <option value="Main">Main</option>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Small Price ($)</label>
                        <input type="number" step="0.5" className="border p-2 rounded-lg text-sm outline-none" value={newItem.prices?.small ?? ''} onChange={e => setNewItem({...newItem, prices: { ...newItem.prices!, small: parseFloat(e.target.value) || 0 }})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Large Price ($)</label>
                        <input type="number" step="0.5" className="border p-2 rounded-lg text-sm outline-none" value={newItem.prices?.large ?? ''} onChange={e => setNewItem({...newItem, prices: { ...newItem.prices!, large: parseFloat(e.target.value) || 0 }})} />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                    <textarea className="border p-2 rounded-lg text-sm outline-none" rows={2} value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Image URL</label>
                    <input className="border p-2 rounded-lg text-sm outline-none mb-2" placeholder="https://..." value={newItem.image || ''} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${editingItem ? 'bg-yellow-500' : 'bg-[#36B1E5] hover:bg-black'}`}>
                        {editingItem ? 'Save Changes' : 'Add to Menu'}
                    </button>
                    {editingItem && <button type="button" onClick={() => { setEditingItem(null); setNewItem({}); }} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold">Cancel</button>}
                </div>
              </form>

              <div className="grid grid-cols-1 gap-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">{item.category}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(item); setNewItem(item); }} className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => { if(window.confirm('Delete?')) setItems(items.filter(i => i.id !== item.id)) }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Site Configuration</h2>
                <button 
                   onClick={() => triggerSave(() => saveSiteContent(siteContent))}
                   className="bg-[#36B1E5] text-white px-8 py-2 rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
                >
                  Save All Changes
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hero Carousel Section */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-[#36B1E5]">
                  <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#36B1E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Hero Images
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {siteContent.hero.images.map((img, idx) => (
                      <div key={img.id} className="p-3 border rounded-xl bg-gray-50 flex gap-4 items-center">
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-200">
                          <img src={img.url} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            className="w-full text-[10px] p-2 border rounded-lg outline-none" 
                            value={img.url} 
                            placeholder="Image URL"
                            onChange={e => {
                              const news = [...siteContent.hero.images];
                              news[idx].url = e.target.value;
                              setSiteContent({...siteContent, hero: { images: news }});
                            }}
                          />
                          <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={img.visible} 
                              onChange={e => {
                                const news = [...siteContent.hero.images];
                                news[idx].visible = e.target.checked;
                                setSiteContent({...siteContent, hero: { images: news }});
                              }}
                            />
                            Visible in Slider
                          </label>
                        </div>
                        <button 
                          onClick={() => {
                            const news = siteContent.hero.images.filter(i => i.id !== img.id);
                            setSiteContent({...siteContent, hero: { images: news }});
                          }}
                          className="text-gray-300 hover:text-red-500 p-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => setSiteContent({
                        ...siteContent, 
                        hero: { images: [...siteContent.hero.images, { id: `h-${Date.now()}`, url: '', visible: true }] }
                      })}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-xs hover:bg-gray-50 transition-colors"
                    >
                      + Add New Hero Slide
                    </button>
                  </div>
                </div>

                {/* About Section Config */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-orange-400">
                   <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-widest">About Story</h3>
                   <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Main Heading</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.about.storyTitle} onChange={e => setSiteContent({...siteContent, about: {...siteContent.about, storyTitle: e.target.value}})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Story Text</label>
                        <textarea rows={4} className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.about.storyText} onChange={e => setSiteContent({...siteContent, about: {...siteContent.about, storyText: e.target.value}})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Featured Image URL</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.about.storyImage} onChange={e => setSiteContent({...siteContent, about: {...siteContent.about, storyImage: e.target.value}})} />
                      </div>
                   </div>
                </div>

                {/* Contact Config */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-green-400">
                   <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-widest">Contact Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Physical Address</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.contact.address} onChange={e => setSiteContent({...siteContent, contact: {...siteContent.contact, address: e.target.value}})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.contact.phone} onChange={e => setSiteContent({...siteContent, contact: {...siteContent.contact, phone: e.target.value}})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Public Email</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.contact.email} onChange={e => setSiteContent({...siteContent, contact: {...siteContent.contact, email: e.target.value}})} />
                      </div>
                   </div>
                </div>

                {/* Social Config */}
                <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-black">
                   <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-widest">Social Media Links</h3>
                   <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Facebook URL</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.socials.facebook} onChange={e => setSiteContent({...siteContent, socials: {...siteContent.socials, facebook: e.target.value}})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Instagram URL</label>
                        <input className="border p-2.5 rounded-xl text-sm outline-none" value={siteContent.socials.instagram} onChange={e => setSiteContent({...siteContent, socials: {...siteContent.socials, instagram: e.target.value}})} />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Manage Testimonials</h2>
                <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-xs font-bold text-gray-500">
                   {testimonials.length} Published Reviews
                </div>
              </div>

              {/* Add New Testimonial Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if(!newTestimonial.name || !newTestimonial.text) return;
                  const updated = [{ id: Date.now(), ...newTestimonial } as Testimonial, ...testimonials];
                  setTestimonials(updated);
                  triggerSave(() => saveTestimonials(updated));
                  setNewTestimonial({ name: '', text: '', rating: 5 });
                }}
                className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-yellow-400 space-y-4"
              >
                <h3 className="text-sm font-bold text-gray-900">Add Manual Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Customer Name" 
                    className="border p-2.5 rounded-xl text-sm outline-none"
                    value={newTestimonial.name || ''} 
                    onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} 
                  />
                  <select 
                    className="border p-2.5 rounded-xl text-sm outline-none"
                    value={newTestimonial.rating || 5} 
                    onChange={e => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                  >
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                  </select>
                </div>
                <textarea 
                  placeholder="Review Text..." 
                  className="w-full border p-2.5 rounded-xl text-sm outline-none"
                  rows={2}
                  value={newTestimonial.text || ''} 
                  onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})} 
                />
                <button className="bg-black text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg">
                  Publish Review
                </button>
              </form>

              {/* Moderation List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.map((t, idx) => (
                  <div key={t.id} className="bg-white p-4 rounded-xl border shadow-sm group hover:border-yellow-200 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-yellow-400 text-xs">{'★'.repeat(t.rating)}</div>
                        <button 
                          onClick={() => {
                            if(window.confirm('Delete this review?')) {
                              const up = testimonials.filter((_, i) => i !== idx);
                              setTestimonials(up);
                              triggerSave(() => saveTestimonials(up));
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg>
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600 italic leading-relaxed">"{t.text}"</p>
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-[10px] font-bold text-yellow-600">
                         {t.name.charAt(0)}
                       </div>
                       <span className="text-[10px] font-bold text-gray-900">{t.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in-up">
                <h2 className="text-3xl font-bold text-gray-900">Configuration & Security</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Order Lead Time Setting - THIS IS WHERE MIN PREP TIME IS EDITED */}
                  <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-[#36B1E5]">
                      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <svg className="w-5 h-5 text-[#36B1E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Order Preparation Settings
                      </h3>
                      <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Min Preparation Time (Hours)</label>
                          <div className="flex gap-4 items-center">
                            <input 
                              type="number" 
                              min="0" 
                              className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold" 
                              value={siteContent.settings?.minPrepTime || 0}
                              onChange={e => setSiteContent({ ...siteContent, settings: { ...siteContent.settings, minPrepTime: parseInt(e.target.value) || 0 }})}
                            />
                            <button 
                              onClick={() => triggerSave(() => saveSiteContent(siteContent))}
                              className="bg-[#36B1E5] text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">Customers won't be able to select a pickup time sooner than this many hours from their current time.</p>
                      </div>
                  </div>

                  {/* Password Setting */}
                  <div className="bg-white p-6 rounded-2xl border shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Admin Security
                      </h3>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if(!newPass || newPass !== confirmPass) return alert("Passwords mismatch");
                        const success = await updatePassword(newPass);
                        if(success) { alert("Updated!"); setNewPass(''); setConfirmPass(''); }
                      }} className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">New Admin Password</label>
                            <input type="password" placeholder="••••••••" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={newPass} onChange={e => setNewPass(e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Confirm Password</label>
                            <input type="password" placeholder="••••••••" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                          </div>
                          <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">Update Password</button>
                      </form>
                  </div>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[2px] z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-3 rounded-full shadow-2xl border border-blue-100 flex items-center gap-3 animate-bounce">
            <div className="w-3 h-3 bg-[#36B1E5] rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-[#36B1E5]">Saving Changes...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;