import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Scan, ShoppingCart, Wallet } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { formatCurrency } from '@/hooks/use-currency';

import { Product, CartItem, Transaction, ViewState } from '@/integrations/supabase/types'; 
import { TAX_RATE } from '@/constants';
import { useTransactionStore } from '@/stores/transactionStore';
import { useToast } from '@/components/ui/use-toast';

import ProductCard from '@/components/ProductCard';
import CartItemComponent from '@/components/CartItem';
import CheckoutModal from '@/components/CheckoutModal';
import ReceiptModal from '@/components/ReceiptModal';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';

function PosPage() {
  const [view, setView] = useState<ViewState>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const kaChingAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState<number | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(0);
  const [activeList, setActiveList] = useState<'products' | 'cart'>('products');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const addTransactionToStore = useTransactionStore((state) => state.addTransaction);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const productItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await (window as any).api.products.getAll();
        if (response.success && response.data) {
          // Map database products to Product interface
          const mappedProducts: Product[] = response.data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            code: p.sku || p.barcode || `PROD-${p.id}`,
            price: parseFloat(p.price) || 0,
            stock: parseInt(p.stock ?? p.stock_quantity) || 0,
            barcode: p.barcode || '',
            category: p.category || 'Uncategorized',
            color: undefined,
          }));
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle barcode scanning/search - moved after addToCart is defined

  const displayedProducts = useMemo(() => {
    const cartQuantities = cart.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {} as { [key: string]: number });

    const updatedProducts = products.map(p => ({
      ...p,
      stock_quantity: p.stock - (cartQuantities[p.id] || 0),
    }));

    const query = searchQuery.toLowerCase();
    if (!query) return updatedProducts;

    return updatedProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [searchQuery, products, cart]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.filter(p => p.stock > 0);
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      (p.name.toLowerCase().includes(query) || 
       p.code.toLowerCase().includes(query) ||
       (p.category && p.category.toLowerCase().includes(query))) &&
      p.stock > 0
    );
  }, [searchQuery, products]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const getStockForProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    return product ? product.stock : 0;
  };
  
  // Cart Actions
  const addToCart = (product: Product) => {
    const cartItem = cart.find(item => item.id === product.id);
    const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
    const availableStock = getStockForProduct(product.id);

    if (currentQuantityInCart < availableStock) {
      setCart(prev => {
        const existingIndex = prev.findIndex(item => item.id === product.id);
        if (existingIndex !== -1) {
          setSelectedCartItemIndex(existingIndex);
          return prev.map((item, index) => 
            index === existingIndex 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        setSelectedCartItemIndex(prev.length);
        return [...prev, { ...product, quantity: 1 }];
      });
      playBeep();
    } else {
      toast({
        title: 'Out of stock',
        description: `${product.name} has no more stock available.`,
        variant: 'destructive',
      });
      playError();
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    const availableStock = getStockForProduct(id);
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const newQty = item.quantity + delta;

      if (newQty < 1) {
        playDecrement();
        return prev.filter(i => i.id !== id);
      }

      if (newQty > availableStock) {
        toast({
          title: 'Stock limit reached',
          description: `Only ${availableStock} in stock for ${item.name}.`,
          variant: 'destructive',
        });
        playError();
        return prev;
      }

      const updated = prev.map(i => (i.id === id ? { ...i, quantity: newQty } : i));
      if (delta > 0) {
        playBeep();
      } else {
        playDecrement();
      }
      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Handle barcode scanning/search
  useEffect(() => {
    if (searchQuery.length >= 8) { // Barcode length is typically 8+ digits
      const handleBarcodeSearch = async () => {
        try {
          const response = await (window as any).api.products.getByBarcode(searchQuery);
          if (response.success && response.data) {
            const product = response.data;
            const mappedProduct: Product = {
              id: product.id.toString(),
              name: product.name,
              code: product.sku || product.barcode || `PROD-${product.id}`,
              price: parseFloat(product.price) || 0,
              stock: parseInt(product.stock) || 0,
              category: product.category || 'Uncategorized',
            };
            addToCart(mappedProduct);
            setSearchQuery('');
          }
        } catch (error) {
          console.error('Failed to search by barcode:', error);
        }
      };
      
      // Debounce barcode search
      const timeoutId = setTimeout(handleBarcodeSearch, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCheckout = () => {
    if (cart.length > 0) setView('checkout');
  };

  const finalizeTransaction = async (amountReceived: number, method: 'cash' | 'qr', referenceNumber?: string) => {
    try {
      // Get current user for transaction record
      const { user } = await (window as any).api.auth.getCurrentUser();
      
      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}`;
      
      // Prepare transaction data for database
      const transactionData = {
        transaction_id: transactionId,
        subtotal,
        tax_amount: tax,
        total_amount: total,
        payment_method: method,
        items: cart.map(item => ({
          product_id: parseInt(item.id),
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        created_by: user ? user.id : null,
      };

      // Save to database
      const response = await (window as any).api.transactions.create(transactionData);
      
      if (response.success) {
        const newTransaction: Transaction = {
          id: transactionId,
          date: new Date(),
          items: [...cart],
          subtotal,
          tax,
          total,
          cashReceived: method === 'cash' ? amountReceived : undefined,
          change: method === 'cash' ? amountReceived - total : undefined,
          paymentMethod: method,
          referenceNumber: method === 'qr' ? referenceNumber : undefined,
          status: 'Completed'
        };
        setTransaction(newTransaction);
        setView('receipt');
        setCart([]);
        playKaChing();
        
        // Refresh products to update stock
        const productsResponse = await (window as any).api.products.getAll();
        if (productsResponse.success && productsResponse.data) {
          const mappedProducts: Product[] = productsResponse.data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            code: p.sku || p.barcode || `PROD-${p.id}`,
            price: parseFloat(p.price) || 0,
            stock: parseInt(p.stock) || parseInt(p.stock_quantity) || 0,
            category: p.category || 'Uncategorized',
          }));
          setProducts(mappedProducts);
        }
      } else {
        throw new Error(response.message || 'Failed to save transaction');
      }
    } catch (error: any) {
      console.error('Failed to finalize transaction:', error);
      alert(`Error: ${error.message || 'Failed to save transaction'}`);
    }
  };

  // Sound Effects
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playBeep = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1040;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.14);
  };

  const playDecrement = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 420;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.14);
  };

  const playError = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 220;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.3);
  };

  const playKaChing = () => {
    const KA_CHING_URL = '/sounds/kaching.mp3'; // Place your own file in public/sounds/kaching.mp3
    if (KA_CHING_URL) {
      try {
        if (!kaChingAudioRef.current) {
          kaChingAudioRef.current = new Audio(KA_CHING_URL);
        }
        const audio = kaChingAudioRef.current;
        audio.currentTime = 0;
        audio.play().catch(() => synthKaChing());
        return;
      } catch {
        synthKaChing();
        return;
      }
    }
    synthKaChing();
  };

  const synthKaChing = () => {
    // Layered "ka-ching" style effect using two quick chimes and a low thump
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playChime = (frequency: number, startTime: number, duration = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    const playThump = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, startTime);
      osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.18);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    };

    playThump(now);
    playChime(1320, now + 0.05);
    playChime(1760, now + 0.14);
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      e.preventDefault();
      const product = products.find(p => p.barcode === searchQuery);
      if (product) {
        addToCart(product);
        setSearchQuery('');
      } else {
        // Handle product not found by maybe showing a toast notification
        console.log('Product not found');
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (view !== 'pos') return;

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsScannerOpen(true);
      }

      if (e.key === 'F1') {
        e.preventDefault();
        if (view === 'pos' && cart.length > 0) handleCheckout();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '`') {
        e.preventDefault();
        setActiveList('cart');
        setSelectedCartItemIndex(0);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveList(prev => (prev === 'products' ? 'cart' : 'products'));
      }

      if (activeList === 'products') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedProductIndex(prev => (prev !== null ? Math.max(0, prev - 4) : 0));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedProductIndex(prev => (prev !== null ? Math.min(displayedProducts.length - 1, prev + 4) : 0));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedProductIndex(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedProductIndex(prev => (prev !== null ? Math.min(displayedProducts.length - 1, prev + 1) : 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedProductIndex !== null) {
            addToCart(displayedProducts[selectedProductIndex]);
          }
        }
      } else if (activeList === 'cart') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCartItemIndex(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCartItemIndex(prev => (prev !== null ? Math.min(cart.length - 1, prev + 1) : 0));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (selectedCartItemIndex !== null) {
            updateQuantity(cart[selectedCartItemIndex].id, -1);
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (selectedCartItemIndex !== null) {
            updateQuantity(cart[selectedCartItemIndex].id, 1);
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (selectedCartItemIndex !== null) {
            removeFromCart(cart[selectedCartItemIndex].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [view, cart, selectedCartItemIndex, activeList, displayedProducts, selectedProductIndex]);

  useEffect(() => {
    if (activeList === 'cart' && selectedCartItemIndex !== null) {
      cartItemsRef.current[selectedCartItemIndex]?.focus();
    } else if (activeList === 'products' && selectedProductIndex !== null) {
      productItemsRef.current[selectedProductIndex]?.focus();
    }
  }, [selectedCartItemIndex, selectedProductIndex, activeList]);

  return (
    <>
      
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <ShoppingCart className="w-5 h-5 text-foreground" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Point of Sale</h1>
              <p className="text-muted-foreground mt-1">Create and manage transactions</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-mono space-x-4">
            <span>F1: Pay</span>
            <span>F2: Search</span>
            <span>Tab: Switch Lists</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-6.5rem)]">
        <div className="flex-1 flex flex-col p-8 pr-2">
           <div className="flex gap-2 mb-4">
             <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="Scan barcode or search product..." 
                 className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-card focus:ring-2 focus:ring-ring focus:border-ring outline-none shadow-sm transition-all"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={handleSearchEnter}
                 autoFocus
               />
             </div>
             <button 
                onClick={() => setIsScannerOpen(true)}
                className="px-6 py-2 bg-card border border-border rounded-lg font-semibold text-muted-foreground flex items-center gap-2 hover:bg-muted transition-colors shadow-sm">

                <Scan size={18} /> Scan Barcode
             </button>
           </div>

           <div className="flex-1 overflow-y-auto pr-2 pb-20">
             <div className="grid grid-cols-4 gap-4">
               {displayedProducts.map((product, index) => (
                 <div 
                  key={product.id} 
                  ref={el => productItemsRef.current[index] = el}
                  tabIndex={-1}
                  className={`rounded-lg focus:outline-none focus:ring-2 m-1 ${activeList === 'products' && selectedProductIndex === index ? 'ring-earth-yellow' : 'ring-transparent'} flex flex-col`}
                  onClick={() => addToCart(product)}
                >
                  <ProductCard product={product} onClick={() => {}} />
                </div>
               ))}
               {displayedProducts.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center text-stone-400 mt-20">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>No products found.</p>
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="w-[35%] bg-card border-l border-border flex flex-col shadow-xl z-10 relative min-h-0">
          <div className="p-4 bg-muted/50 border-b border-border sticky top-0 z-10">
             <div className="flex items-center gap-3">
               <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                 <ShoppingCart size={20} />
               </div>
               <div>
                 <h2 className="font-bold text-foreground">Purchase List</h2>
                 <p className="text-xs text-stone-500">{cart.length} items</p>
               </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-5 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4 opacity-60">
                <ShoppingCart size={64} />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div 
                  key={item.id} 
                  ref={el => cartItemsRef.current[index] = el}
                  tabIndex={-1} 
                  className={`rounded-lg focus:outline-none focus:ring-2 ${activeList === 'cart' && selectedCartItemIndex === index ? 'ring-earth-yellow' : 'ring-transparent'}`}
                >
                  <CartItemComponent 
                    item={item} 
                    onIncrement={() => updateQuantity(item.id, 1)}
                    onDecrement={() => updateQuantity(item.id, -1)}
                    onRemove={() => removeFromCart(item.id)}
                    isSelected={activeList === 'cart' && selectedCartItemIndex === index}
                  />
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="space-y-2 text-sm mb-6">
               <div className="flex justify-between text-stone-500">
                 <span>Subtotal</span>
                 <span>{formatCurrency(subtotal)}</span>
               </div>
               <div className="flex justify-between text-stone-500">
                 <span>VAT (12% included)</span>
                 <span>{formatCurrency((total / 1.12) * 0.12)}</span>
               </div>
               <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-100">
                 <span className="font-bold text-xl text-foreground">Total</span>
                 <span className="font-black text-3xl text-foreground">{formatCurrency(total)}</span>
               </div>
             </div>

             <div className="grid gap-3">
               <button 
                  onClick={() => handleCheckout()}
                  disabled={cart.length === 0}
                  className="px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
               >
                 <Wallet size={18} /> Cash (F1)
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

      <BarcodeScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => {
          const product = products.find(p => p.barcode === barcode);
          if (product) {
            addToCart(product);
          }
          setIsScannerOpen(false);
        }}
      />

    </>
  );
}
export default PosPage;