import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, OrderItem, Order, SiteContent } from '../types';
import { getMenu, saveOrders, getOrders, getSiteContent, FALLBACK_MENU, FALLBACK_CONTENT } from '../services/storage';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const OrderPage: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>(FALLBACK_MENU);
  const [siteSettings, setSiteSettings] = useState<SiteContent['settings']>(FALLBACK_CONTENT.settings);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupTime: '',
    allergens: '',
    comments: ''
  });

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [menuData, contentData, ordData] = await Promise.all([
          getMenu(),
          getSiteContent(),
          getOrders()
        ]);
        if (menuData?.length) setMenu(menuData.filter(item => item.visible));
        if (contentData?.settings) setSiteSettings(contentData.settings);
        if (ordData) setOrders(ordData);
      } catch (e) {
        console.error("OrderPage load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
    window.scrollTo(0, 0);
  }, []);

  // Calculate min pickup time based on business settings
  const minPickupDateTime = useMemo(() => {
    const minLeadTime = siteSettings.minPrepTime || 0;
    const now = new Date();
    now.setHours(now.getHours() + minLeadTime);
    
    // Format to YYYY-MM-DDTHH:MM for datetime-local min attribute
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [siteSettings.minPrepTime]);

  // Calendar Preview: Days with high order counts
  const busyDays = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const dateStr = new Date(o.pickupTime).toDateString();
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const addToCart = (item: MenuItem, size: 'small' | 'large') => {
    const price = item.prices[size];
    if (price <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.itemId === item.id && i.size === size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        size,
        quantity: 1,
        price
      }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add at least one item to your order.");
      return;
    }

    // Double check prep time on submission
    const selected = new Date(formData.pickupTime).getTime();
    const minPossible = new Date(minPickupDateTime).getTime();
    if (selected < minPossible) {
      alert(`Sorry, we need at least ${siteSettings.minPrepTime} hours to prepare this order. Please select a later time.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const existingOrders = await getOrders();
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        pickupTime: formData.pickupTime,
        allergens: formData.allergens,
        comments: formData.comments,
        items: cart,
        total: cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await saveOrders([...existingOrders, newOrder]);
      setSubmitted(true);
    } catch (err) {
      alert("Failed to place order. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Received!</h2>
          <p className="text-gray-600 mb-8">
            Thank you, <span className="font-bold">{formData.name}</span>. We've received your request. We'll contact you at <span className="font-bold">{formData.phone}</span> shortly to confirm.
          </p>
          <Link to="/" className="inline-block bg-[#36B1E5] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm py-4 sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="font-script text-2xl text-[#36B1E5]">JoShem Foods</span>
          </Link>
          <Link to="/" className="text-xs font-bold text-gray-400 hover:text-[#36B1E5] uppercase tracking-widest">← Back</Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 mt-8">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Catering Order</h1>
          <p className="text-gray-600">Delicious Filipino food for your special occasion.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Menu Selection */}
          <div className="lg:col-span-2 space-y-8">
            {loading && menu.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#36B1E5]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {menu.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                    <div className="h-40 overflow-hidden relative">
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                        {item.isDailySpecial && <span className="absolute top-2 left-2 bg-yellow-400 text-black font-bold text-[8px] px-2 py-0.5 rounded uppercase">Daily Special</span>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                      <p className="text-gray-500 text-xs mb-4 line-clamp-2 h-8">{item.description}</p>
                      
                      <div className="flex flex-col gap-2">
                        {item.prices.small > 0 && (
                          <button 
                            onClick={() => addToCart(item, 'small')}
                            className="flex justify-between items-center bg-gray-50 hover:bg-[#36B1E5] hover:text-white px-3 py-2 rounded text-sm font-bold transition-colors"
                          >
                            <span>Small Portion</span>
                            <span>${item.prices.small.toFixed(2)}</span>
                          </button>
                        )}
                        {item.prices.large > 0 && (
                          <button 
                            onClick={() => addToCart(item, 'large')}
                            className="flex justify-between items-center bg-gray-50 hover:bg-black hover:text-white px-3 py-2 rounded text-sm font-bold transition-colors"
                          >
                            <span>Large Portion</span>
                            <span>${item.prices.large.toFixed(2)}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout & Lead Time Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 sticky top-24">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#36B1E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  Your Selection
                </h2>
              </div>
              
              <div className="max-h-[250px] overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 italic text-sm">Your basket is empty.</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-800">{item.name}</span>
                            <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 uppercase font-black">{item.size}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <button onClick={() => updateQuantity(idx, -1)} className="text-[#36B1E5] hover:bg-blue-50 w-5 h-5 flex items-center justify-center rounded border border-blue-100 font-bold">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} className="text-[#36B1E5] hover:bg-blue-50 w-5 h-5 flex items-center justify-center rounded border border-blue-100 font-bold">+</button>
                            <span className="text-[10px] text-gray-400 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-gray-50 space-y-4 rounded-b-2xl">
                <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                  <span>Total Est.</span>
                  <span className="text-[#36B1E5]">${cartTotal.toFixed(2)}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                   <div className="grid grid-cols-1 gap-4">
                     <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Full Name *</label>
                        <input required className="border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="Juana Dela Cruz" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Phone Number *</label>
                        <input required type="tel" className="border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="(555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Email *</label>
                        <input required type="email" className="border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="customer@mail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                     </div>
                   </div>

                   <div className="flex flex-col gap-1 border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#36B1E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Pickup Time *
                        </label>
                        <span className="text-[9px] text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                           {siteSettings.minPrepTime}h lead time required
                        </span>
                      </div>
                      <input 
                        required 
                        type="datetime-local"
                        min={minPickupDateTime}
                        className="border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                        value={formData.pickupTime}
                        onChange={e => setFormData({...formData, pickupTime: e.target.value})}
                      />
                      {formData.pickupTime && busyDays[new Date(formData.pickupTime).toDateString()] && (
                        <p className="text-[9px] text-blue-500 mt-1 flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          We have {busyDays[new Date(formData.pickupTime).toDateString()]} other orders on this day.
                        </p>
                      )}
                   </div>

                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Allergens / Requests</label>
                      <textarea className="border p-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 h-20 resize-none" placeholder="Peanuts, Shellfish, etc." value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} />
                   </div>

                   <button 
                     type="submit" 
                     disabled={cart.length === 0 || isSubmitting}
                     className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                       cart.length === 0 || isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#36B1E5] hover:bg-black transform active:scale-95'
                     }`}
                   >
                     {isSubmitting ? 'Submitting...' : 'Send Catering Request'}
                   </button>
                   <p className="text-[9px] text-gray-400 text-center italic leading-tight">By submitting, you agree to our catering terms. We will call you within 2-4 business hours to confirm availability and finalize pricing.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;