import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Scan, ShoppingCart, Wallet } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { formatCurrency } from '@/hooks/use-currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const isProcessingQuantity = useRef(false);

  const addTransactionToStore = useTransactionStore((state) => state.addTransaction);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const productItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch products from SQLite database (single source of truth)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('POS: Fetching products from SQLite...');

        // Prefer inventory-style data if available so POS mirrors the Inventory page
        if (typeof window !== 'undefined' && (window as any).api?.products?.getInventory) {
          console.log('POS: Using products:getInventory for POS items...');
          const response = await (window as any).api.products.getInventory();
          console.log('POS: getInventory response:', response);

          if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
            const mappedProducts: Product[] = response.data.map((p: any) => ({
              id: p.id?.toString() ?? '',
              name: p.name ?? '',
              code: p.sku || p.barcode || `PROD-${p.id}`,
              price: Number(p.price) || 0,
              stock: Number(p.stock ?? 0),
              barcode: p.barcode ?? '',
              category: p.category ?? 'Uncategorized',
              image: p.imageUrl || p.image_url || undefined,
              color: undefined,
            }));

            console.log(`POS: Loaded ${mappedProducts.length} products from SQLite via getInventory`);
            setProducts(mappedProducts);
            return;
          } else {
            console.log('POS: No products found via getInventory or invalid data', response);
          }
        }

        // Use products:getAll which fetches from SQLite
        if (typeof window !== 'undefined' && (window as any).api?.products?.getAll) {
          const response = await (window as any).api.products.getAll();
          console.log('POS: Products response (getAll):', response);
          
          if (response && response.success && Array.isArray(response.data)) {
            // Map SQLite database products to Product interface
            const mappedProducts: Product[] = response.data
              .filter((p: any) => p.is_active !== 0) // Only active products
              .map((p: any) => ({
                id: p.id?.toString() ?? '',
                name: p.name ?? '',
                code: p.sku || p.barcode || `PROD-${p.id}`,
                price: Number(p.price ?? p.selling_price ?? 0),
                stock: Number(p.stock ?? p.stock_quantity ?? 0),
                barcode: p.barcode ?? '',
                category: p.category ?? 'Uncategorized',
                image: p.imageUrl || p.image_url || undefined,
                color: undefined,
              }));
            
            console.log(`POS: Loaded ${mappedProducts.length} products from SQLite via getAll`);
            setProducts(mappedProducts);
            return;
          } else {
            console.warn('POS: Invalid response from products:getAll', response);
          }
        } else {
          console.error('POS: products:getAll API not available');
        }

        // Fallback: use local IndexedDB data (same as Inventory page)
        console.warn('POS: Falling back to IndexedDB via dbService.getProducts()');
        const { dbService } = await import('@/services/database');
        const localProducts = await dbService.getProducts();
        const mappedLocal: Product[] = localProducts.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          code: p.sku || p.barcode || `PROD-${p.id}`,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          barcode: p.barcode || '',
          category: p.category || 'Uncategorized',
          color: undefined,
        }));
        setProducts(mappedLocal);
      } catch (error) {
        console.error('POS: Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Preload the ka-ching audio once to avoid first-play delay
  useEffect(() => {
    try {
      const audio = new Audio('/sounds/kaching.mp3');
      audio.load();
      kaChingAudioRef.current = audio;
    } catch {
      // ignore preload errors
    }
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
  
  const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const { dbService } = await import('@/services/database');
      const products = await dbService.getProducts();
      const match = products.find((p: any) => (p.barcode ?? '').toString() === barcode);
      if (match) {
        return {
          id: match.id?.toString?.() ?? '',
          name: match.name,
          code: match.sku || match.barcode || `PROD-${match.id}`,
          price: Number(match.price) || 0,
          stock: Number(match.stock ?? 0) || 0,
          barcode: match.barcode || '',
          category: match.category || 'Uncategorized',
          color: undefined,
        };
      }
    } catch (err) {
      console.error('Barcode lookup via IndexedDB failed', err);
    }
    return null;
  };

  // Cart Actions
  const addToCart = (product: Product, quantity: number = 1, replaceExisting: boolean = false) => {
    setCart(prev => {
      const cartItem = prev.find(item => item.id === product.id);
      const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
      const availableStock = getStockForProduct(product.id);
      
      // If replaceExisting is true (from quantity modal), use the exact quantity
      // Otherwise, add to existing (for clicking products directly)
      const finalQuantity = replaceExisting ? quantity : (currentQuantityInCart + quantity);

      if (finalQuantity > availableStock) {
        // Return previous state if over stock - error will be shown below
        return prev;
      }

      const existingIndex = prev.findIndex(item => item.id === product.id);
      if (existingIndex !== -1) {
        setSelectedCartItemIndex(existingIndex);
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: finalQuantity } 
            : item
        );
      }
      setSelectedCartItemIndex(prev.length);
      // For new items, always use the provided quantity
      return [...prev, { ...product, quantity }];
    });
    
    // Check if we need to show error (do this after state update)
    setCart(currentCart => {
      const cartItem = currentCart.find(item => item.id === product.id);
      if (!cartItem) {
        // Item wasn't added, check why
        const availableStock = getStockForProduct(product.id);
        const currentQuantityInCart = 0;
        const finalQuantity = replaceExisting ? quantity : (currentQuantityInCart + quantity);
        
        if (finalQuantity > availableStock) {
          toast({
            title: 'Out of stock',
            description: `${product.name} has no more stock available.`,
            variant: 'destructive',
          });
          playError();
          return currentCart;
        }
      }
      return currentCart;
    });
    
    playBeep();
  };

  const handleScannedProduct = (product: Product) => {
    // Check if product is out of stock BEFORE opening modal
    const availableStock = getStockForProduct(product.id);
    if (availableStock <= 0) {
      toast({
        title: 'Out of Stock',
        description: `${product.name} is currently out of stock.`,
        variant: 'destructive',
      });
      playError();
      // Ensure modal is closed
      setIsQuantityModalOpen(false);
      setScannedProduct(null);
      setQuantityInput('');
      return;
    }
    
    // Only open modal if product has stock
    setScannedProduct(product);
    setQuantityInput(''); // Empty by default, user must input
    isProcessingQuantity.current = false; // Reset processing flag
    setIsQuantityModalOpen(true);
    // Focus quantity input after modal opens
    setTimeout(() => quantityInputRef.current?.focus(), 100);
  };

  const handleQuantityConfirm = () => {
    // Prevent double calls
    if (isProcessingQuantity.current) {
      console.log('handleQuantityConfirm: Already processing, ignoring duplicate call');
      return;
    }
    
    if (!scannedProduct) {
      console.log('handleQuantityConfirm: No scanned product');
      return;
    }
    
    isProcessingQuantity.current = true;
    
    // Parse and validate quantity
    const inputValue = quantityInput.trim();
    if (!inputValue) {
      isProcessingQuantity.current = false;
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity greater than 0.',
        variant: 'destructive',
      });
      playError();
      return;
    }
    
    const qty = parseInt(inputValue, 10);
    if (isNaN(qty) || qty <= 0) {
      isProcessingQuantity.current = false;
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity greater than 0.',
        variant: 'destructive',
      });
      playError();
      return;
    }
    
    const availableStock = getStockForProduct(scannedProduct.id);
    if (qty > availableStock) {
      isProcessingQuantity.current = false;
      toast({
        title: 'Insufficient Stock',
        description: `Only ${availableStock} unit(s) available for ${scannedProduct.name}.`,
        variant: 'destructive',
      });
      playError();
      return;
    }
    
    const productId = scannedProduct.id;
    const productName = scannedProduct.name;
    
    // Directly update cart with EXACT quantity (no addition, no modification)
    // Use functional update to ensure we have latest cart state
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === productId);
      
      if (existingIndex !== -1) {
        // Product exists in cart - REPLACE with exact quantity (not add)
        const oldQty = prev[existingIndex].quantity;
        setSelectedCartItemIndex(existingIndex);
        const updated = prev.map((item, index) => {
          if (index === existingIndex) {
            // CRITICAL: Use exact qty value, NEVER add to existing quantity
            console.log(`[handleQuantityConfirm] REPLACING: ${productName} quantity ${oldQty} -> ${qty}`);
            return { ...item, quantity: qty };
          }
          return item;
        });
        return updated;
      } else {
        // Product not in cart - add with exact quantity
        setSelectedCartItemIndex(prev.length);
        console.log(`[handleQuantityConfirm] ADDING: ${productName} with quantity ${qty}`);
        return [...prev, { ...scannedProduct, quantity: qty }];
      }
    });
    
    playBeep();
    setIsQuantityModalOpen(false);
    setScannedProduct(null);
    setQuantityInput('');
    isProcessingQuantity.current = false;
    // Keep scanner open for continuous scanning
  };

  const handleQuantityChange = (delta: number) => {
    if (!scannedProduct) return;
    const currentQty = parseInt(quantityInput) || 0;
    const maxQty = getStockForProduct(scannedProduct.id);
    const newQty = Math.max(1, Math.min(maxQty, currentQty + delta));
    setQuantityInput(newQty.toString());
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

  // Handle barcode scanning/search (from SQLite)
  useEffect(() => {
    if (searchQuery.length >= 8) { // Barcode length is typically 8+ digits
      const handleBarcodeSearch = async () => {
        try {
          console.log('POS: Searching for barcode:', searchQuery);
          const response = await (window as any).api.products.getByBarcode(searchQuery);
          console.log('POS: Barcode search response:', response);
          
          if (response && response.success && response.data) {
            const product = response.data;
            
            // Only add if product is active
            if (product.is_active === 0) {
              console.warn('POS: Product found but is inactive:', product.name);
              return;
            }
            
            const mappedProduct: Product = {
              id: product.id?.toString() ?? '',
              name: product.name ?? '',
              code: product.sku || product.barcode || `PROD-${product.id}`,
              price: Number(product.price ?? product.selling_price ?? 0),
              stock: Number(product.stock ?? product.stock_quantity ?? 0),
              barcode: product.barcode ?? '',
              category: product.category ?? 'Uncategorized',
              color: undefined,
            };
            
            console.log('POS: Adding product to cart via barcode:', mappedProduct);
            addToCart(mappedProduct);
            setSearchQuery(''); // Clear search after adding
            // Keep focus in the search input after auto-adding via barcode scan
            setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
          } else {
            console.log('POS: No product found for barcode:', searchQuery);
          }
        } catch (error) {
          console.error('POS: Barcode search failed:', error);
        }
      };

      handleBarcodeSearch();
    }
  }, [searchQuery]);
  
  // Passive barcode scanning: auto-add when a scan hits the input
  useEffect(() => {
    if (searchQuery.length >= 3) {
      const timeoutId = setTimeout(async () => {
        const found = await findProductByBarcode(searchQuery);
        if (found) {
          addToCart(found);
          setSearchQuery('');
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, addToCart]);

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
          product_id: Number(item.id),
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        created_by: user ? user.id : null,
      };

      // Save to database
      const response = await (window as any).api.transactions.create(transactionData);

      if (response.success) {
        // Play cash register immediately after persistence to avoid UI lag
        playKaChing();

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
          status: 'Completed',
        };

        addTransactionToStore(newTransaction);
        setTransaction(newTransaction);
        setView('receipt');
        setCart([]);
        playKaChing();

        // Refresh products from SQLite to update stock after transaction
        console.log('POS: Refreshing products after transaction...');

        try {
          // Prefer inventory-style data just like initial load
          if (typeof window !== 'undefined' && (window as any).api?.products?.getInventory) {
            const invResponse = await (window as any).api.products.getInventory();
            console.log('POS: post-transaction getInventory response:', invResponse);

            if (invResponse && invResponse.success && Array.isArray(invResponse.data) && invResponse.data.length > 0) {
              const mappedProducts: Product[] = invResponse.data.map((p: any) => ({
                id: p.id?.toString() ?? '',
                name: p.name ?? '',
                code: p.sku || p.barcode || `PROD-${p.id}`,
                price: Number(p.price) || 0,
                stock: Number(p.stock ?? 0),
                barcode: p.barcode ?? '',
                category: p.category ?? 'Uncategorized',
                color: undefined,
              }));
              console.log(`POS: Refreshed ${mappedProducts.length} products via getInventory`);
              setProducts(mappedProducts);
            } else {
              console.log('POS: No products found via getInventory during refresh, falling back to getAll.', invResponse);
              throw new Error('Empty or invalid getInventory response');
            }
          } else {
            throw new Error('products:getInventory not available');
          }
        } catch (refreshError) {
          console.warn('POS: getInventory refresh failed, falling back to getAll:', refreshError);
          if (typeof window !== 'undefined' && (window as any).api?.products?.getAll) {
            const productsResponse = await (window as any).api.products.getAll();
            if (productsResponse && productsResponse.success && Array.isArray(productsResponse.data)) {
              const mappedProducts: Product[] = productsResponse.data
                .filter((p: any) => p.is_active !== 0)
                .map((p: any) => ({
                  id: p.id?.toString() ?? '',
                  name: p.name ?? '',
                  code: p.sku || p.barcode || `PROD-${p.id}`,
                  price: Number(p.price ?? p.selling_price ?? 0),
                  stock: Number(p.stock ?? p.stock_quantity ?? 0),
                  barcode: p.barcode ?? '',
                  category: p.category ?? 'Uncategorized',
                  color: undefined,
                }));
              console.log(`POS: Refreshed ${mappedProducts.length} products via getAll`);
              setProducts(mappedProducts);
            } else {
              console.warn('POS: Failed to refresh products via getAll after transaction', productsResponse);
            }
          }
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
      e.stopPropagation(); // Prevent event from bubbling to global handler
      const product = products.find(p => p.barcode === searchQuery);
      if (product) {
        addToCart(product);
        setSearchQuery('');
        // Keep focus in the search input after adding product
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      } else {
        // Handle product not found by maybe showing a toast notification
        console.log('Product not found');
        // Keep focus in the search input even if product not found
        searchInputRef.current?.focus();
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (view !== 'pos') return;

      // Don't handle Enter if search input is focused
      const isSearchInputFocused = document.activeElement === searchInputRef.current;

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
        } else if (e.key === 'Enter' && !isSearchInputFocused) {
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
              <span>Spacebar: Scan</span>
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
          const normalized = (barcode ?? '').toString().trim();
          console.log('POS: Scanner modal scanned barcode:', normalized);
          
          if (!normalized) {
            return;
          }
          
          const match = products.find(
            (p) => (p.barcode ?? '').toString().trim() === normalized,
          );
          if (match) {
            handleScannedProduct(match);
            return;
          }
          
          // Try to find product in database
          void findProductByBarcode(normalized).then((fallback) => {
            if (fallback) {
              handleScannedProduct(fallback);
            } else {
              // Product not found in inventory
              toast({
                title: 'Product Not Found',
                description: `No product found with barcode: ${normalized}. Please add it to inventory first.`,
                variant: 'destructive',
              });
              playError();
              // Ensure quantity modal is closed
              setIsQuantityModalOpen(false);
              setScannedProduct(null);
              setQuantityInput('');
              isProcessingQuantity.current = false;
              console.warn('POS: No product found for scanned barcode:', normalized);
            }
          });
        }}
      />

      {/* Quantity Input Modal - Higher z-index than scanner */}
      <Dialog open={isQuantityModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsQuantityModalOpen(false);
          setScannedProduct(null);
          setQuantityInput('');
          isProcessingQuantity.current = false; // Reset when modal closes
        }
      }}>
        <DialogContent className="max-w-md !z-[2000]" style={{ zIndex: 2000 }}>
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {scannedProduct && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-base font-semibold">{scannedProduct.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Available: {getStockForProduct(scannedProduct.id)} | Price: {formatCurrency(scannedProduct.price)}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="quantity" className="text-base font-medium">Quantity</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  className="w-14 h-14 rounded-lg border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-2xl font-bold text-primary"
                  disabled={!quantityInput || parseInt(quantityInput) <= 1}
                >
                  −
                </button>
                <Input
                  id="quantity"
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  step="1"
                  max={scannedProduct ? getStockForProduct(scannedProduct.id) : 999}
                  value={quantityInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty string or valid numbers
                    if (val === '' || /^\d+$/.test(val)) {
                      const numVal = parseInt(val);
                      if (val === '' || (numVal > 0 && numVal <= (scannedProduct ? getStockForProduct(scannedProduct.id) : 999))) {
                        setQuantityInput(val);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQuantityConfirm();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setIsQuantityModalOpen(false);
                      setScannedProduct(null);
                      setQuantityInput('');
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      handleQuantityChange(1);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      handleQuantityChange(-1);
                    }
                  }}
                  className="flex-1 h-14 text-center text-3xl font-bold"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="w-14 h-14 rounded-lg border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center text-2xl font-bold text-primary"
                  disabled={!quantityInput || parseInt(quantityInput) >= (scannedProduct ? getStockForProduct(scannedProduct.id) : 999)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsQuantityModalOpen(false);
                  setScannedProduct(null);
                  setQuantityInput('');
                }}
                className="px-6 py-2.5 text-sm border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityConfirm();
                }}
                className="px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
export default PosPage;