import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Order } from '../types';
import { getMenu, saveOrders, getOrders } from '../services/storage';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const OrderPage: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupTime: '',
    allergens: '',
    comments: ''
  });

  useEffect(() => {
    const loadMenu = async () => {
      const data = await getMenu();
      setMenu(data.filter(item => item.visible));
      setLoading(false);
    };
    loadMenu();
    window.scrollTo(0, 0);
  }, []);

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
            Thank you, <span className="font-bold">{formData.name}</span>. We've received your catering request. We will contact you at <span className="font-bold">{formData.phone}</span> or <span className="font-bold">{formData.email}</span> shortly to confirm.
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
          <Link to="/" className="text-sm text-gray-500 hover:text-[#36B1E5] font-bold">← Continue Browsing</Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 mt-8">
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Place Your Order</h1>
          <p className="text-gray-600">Select items from our menu and let us know your requirements.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Menu Selection */}
          <div className="lg:col-span-2 space-y-8">
            {loading ? (
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

          {/* Cart and Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#36B1E5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Your Selection
                </h2>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 italic">Your cart is empty.</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{item.name}</span>
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 uppercase">{item.size}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <button onClick={() => updateQuantity(idx, -1)} className="text-[#36B1E5] hover:bg-blue-50 w-5 h-5 flex items-center justify-center rounded border border-blue-100">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} className="text-[#36B1E5] hover:bg-blue-50 w-5 h-5 flex items-center justify-center rounded border border-blue-100">+</button>
                            <span className="text-xs text-gray-400 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500 ml-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name *</label>
                      <input 
                        required 
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#36B1E5]" 
                        placeholder="Juana Dela Cruz"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address *</label>
                      <input 
                        required 
                        type="email"
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#36B1E5]" 
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number *</label>
                      <input 
                        required 
                        type="tel"
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#36B1E5]" 
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Desired Pickup Time *</label>
                      <input 
                        required 
                        type="datetime-local"
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#36B1E5]"
                        value={formData.pickupTime}
                        onChange={e => setFormData({...formData, pickupTime: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Allergens (if any)</label>
                      <input 
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-red-400" 
                        placeholder="Peanuts, Shellfish, etc."
                        value={formData.allergens}
                        onChange={e => setFormData({...formData, allergens: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Additional Comments</label>
                      <textarea 
                        className="border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#36B1E5]" 
                        rows={2}
                        placeholder="Specific instructions..."
                        value={formData.comments}
                        onChange={e => setFormData({...formData, comments: e.target.value})}
                      />
                   </div>

                   <button 
                     type="submit" 
                     disabled={cart.length === 0 || isSubmitting}
                     className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                       cart.length === 0 || isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#36B1E5] hover:bg-black'
                     }`}
                   >
                     {isSubmitting ? 'Processing...' : 'Submit Catering Order'}
                   </button>
                   <p className="text-[10px] text-gray-400 text-center italic">Payment will be settled upon confirmation.</p>
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