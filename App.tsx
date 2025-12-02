import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Scan, ShoppingCart, CreditCard } from 'lucide-react';
import { Product, CartItem, Transaction, ViewState } from './types';
import { MOCK_PRODUCTS, TAX_RATE } from './constants';
import ProductCard from './src/components/ProductCard';
import CartItemComponent from './src/components/CartItem';
import CheckoutModal from './src/components/CheckoutModal';
import ReceiptModal from './src/components/ReceiptModal';

function App() {
  const [view, setView] = useState<ViewState>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  
  // Cart Actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Play beep sound (simulated)
    playBeep();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => {
    if (cart.length > 0) setView('checkout');
  };

  const finalizeTransaction = (amountReceived: number, method: 'cash' | 'card') => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(),
      items: [...cart],
      subtotal,
      tax,
      total,
      cashReceived: amountReceived,
      change: amountReceived - total,
      paymentMethod: method
    };
    setTransaction(newTransaction);
    setView('receipt');
    setCart([]);
    playKaChing();
  };

  // Sound Effects
  const playBeep = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  };

  const playKaChing = () => {
    // Simple high pitch success sound
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.1;
    osc.type = 'sine';
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // F2: Search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F3: Scan (Simulate by focusing search or adding random item? Focus search is standard)
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        // Ideally this toggles a "Scan Mode", but focusing search works for barcode scanners acting as keyboards
      }
      // F12: Checkout
      if (e.key === 'F12') {
        e.preventDefault();
        if (view === 'pos' && cart.length > 0) handleCheckout();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [view, cart]);

  return (
    <div className="h-screen w-screen bg-[#EDE8E6] flex flex-col font-sans text-stone-800 overflow-hidden">
      
      {/* Top Header */}
      <header className="h-14 bg-[#E5DCD6] flex items-center justify-between px-6 shrink-0 border-b border-stone-300">
        <div>
           <h1 className="text-xl font-bold text-stone-900 tracking-tight">LW Mini Mart</h1>
           <div className="text-[10px] text-stone-600 font-mono space-x-2">
             <span>F2: Search</span>
             <span>|</span>
             <span>F3: Scan</span>
             <span>|</span>
             <span>F12: Checkout</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-500 font-bold text-xl">◆</span>
          <span className="font-bold text-2xl text-stone-800 tracking-tight">lifewood</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Search & Product Grid */}
        <div className="flex-1 flex flex-col p-4 pr-2 max-w-[65%]">
           
           {/* Search Bar */}
           <div className="flex gap-2 mb-4">
             <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="Scan barcode or search product..." 
                 className="w-full pl-12 pr-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none shadow-sm transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 autoFocus
               />
             </div>
             <button className="px-6 py-2 bg-white border border-stone-300 rounded-lg font-semibold text-stone-600 flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm">
                <Scan size={18} /> Scan
             </button>
           </div>

           {/* Product Grid */}
           <div className="flex-1 overflow-y-auto pr-2 pb-20">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {filteredProducts.map(product => (
                 <div key={product.id} className="h-64">
                   <ProductCard product={product} onClick={addToCart} />
                 </div>
               ))}
               {filteredProducts.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center text-stone-400 mt-20">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>No products found.</p>
                 </div>
               )}
             </div>
           </div>
        </div>

        {/* Right Panel: Cart */}
        <div className="w-[35%] bg-[#FDFBF7] border-l border-stone-200 flex flex-col shadow-xl z-10 relative">
          
          {/* Cart Header */}
          <div className="p-4 bg-[#F5F0EB] border-b border-stone-200">
             <div className="flex items-center gap-3">
               <div className="bg-[#3E5C48] p-2 rounded-lg text-white">
                 <ShoppingCart size={20} />
               </div>
               <div>
                 <h2 className="font-bold text-stone-800">Purchase List</h2>
                 <p className="text-xs text-stone-500">{cart.length} items</p>
               </div>
             </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FDFBF7]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
                <ShoppingCart size={64} />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <CartItemComponent 
                  key={item.id} 
                  item={item} 
                  onIncrement={() => addToCart(item)}
                  onDecrement={() => updateQuantity(item.id, -1)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))
            )}
          </div>

          {/* Cart Summary & Actions */}
          <div className="p-6 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="space-y-2 text-sm mb-6">
               <div className="flex justify-between text-stone-500">
                 <span>Subtotal</span>
                 <span>₱{subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-stone-500">
                 <span>VAT (12% included)</span>
                 <span>₱{((total / 1.12) * 0.12).toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-100">
                 <span className="font-bold text-xl text-stone-800">Total</span>
                 <span className="font-black text-3xl text-stone-900">₱{total.toFixed(2)}</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => handleCheckout()}
                  disabled={cart.length === 0}
                  className="px-4 py-3 border border-stone-300 rounded-lg font-bold text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <CreditCard size={18} /> Card (F5)
               </button>
               <button 
                  onClick={() => handleCheckout()}
                  disabled={cart.length === 0}
                  className="px-4 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
               >
                 <span className="text-lg">💵</span> Cash (F1)
               </button>
             </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {view === 'checkout' && (
        <CheckoutModal 
          total={total} 
          onConfirm={finalizeTransaction} 
          onCancel={() => setView('pos')} 
        />
      )}

      {view === 'receipt' && transaction && (
        <ReceiptModal 
          transaction={transaction}
          onClose={() => setView('pos')}
        />
      )}

    </div>
  );
}

export default App;
