import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { dbService, Product } from '@/services/database';
import { toast } from 'sonner';
import { useScannerStore } from '@/stores/scannerStore';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductDialog({ isOpen, onClose, onProductAdded }: AddProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [restockData, setRestockData] = useState({
    stock: '',
    batchNo: '',
    expiryDate: '',
    barcode: '',
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const lastScannedBarcode = useScannerStore((s) => s.lastScannedBarcode);

  useEffect(() => {
    if (isOpen && lastScannedBarcode) {
      setFormData((prev) => ({ ...prev, barcode: prev.barcode || lastScannedBarcode }));
    }
  }, [isOpen, lastScannedBarcode]);

  useEffect(() => {
    if (isOpen) {
      const id = window.requestAnimationFrame(() => nameInputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [isOpen]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    supplier: '',
    cost: '',
    price: '',
    stock: '',
    minStock: '',
    expiryDate: '',
    batchNo: '',
    barcode: '',
    imageUrl: ''
  });

  const checkExistingByName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setExistingProduct(null);
      return;
    }
    try {
      // Check SQLite first (single source of truth)
      if (typeof window !== 'undefined' && (window as any).api?.products?.getAll) {
        const response = await (window as any).api.products.getAll();
        if (response.success && response.data) {
          const match = response.data.find((p: any) => 
            p.name && p.name.toLowerCase() === trimmed.toLowerCase()
          );
          if (match) {
            // Map SQLite product to Product format for existing product check
            setExistingProduct({
              id: match.id.toString(),
              name: match.name,
              sku: match.sku || '',
              category: match.category || 'Uncategorized',
              supplier: '',
              cost: match.purchase_price || 0,
              price: match.price || match.selling_price || 0,
              stock: match.stock_quantity || match.stock || 0,
              minStock: match.reorder_threshold || 0,
              expiryDate: '',
              status: 'In Stock',
              batchNo: '',
              barcode: match.barcode || '',
              imageUrl: '',
              createdAt: '',
              updatedAt: '',
            });
            return;
          }
        }
      }
      
      // Fallback to IndexedDB only if SQLite not available
      const products = await dbService.getProducts();
      const match = products.find((p) => p.name.toLowerCase() === trimmed.toLowerCase()) || null;
      setExistingProduct(match);
    } catch (error) {
      console.error('Error checking existing product by name:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === 'cost') {
        const costNumber = parseFloat(value) || 0;
        const sellingPrice = costNumber + costNumber * 0.2;
        updated.price = sellingPrice.toFixed(2);
      }

      return updated;
    });

    if (name === 'name') {
      void checkExistingByName(value);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'category') {
      void generateSkuForCategory(value);
    }
  };

  const generateSkuForCategory = async (category: string) => {
    const skuPrefixMap: Record<string, string> = {
      Beverages: 'B',
      Food: 'F',
      Supplements: 'SU',
      Snacks: 'SN',
      Other: 'O',
    };
    const prefix = skuPrefixMap[category] ?? 'O';
    
    try {
      // Get products from SQLite (single source of truth)
      if (typeof window !== 'undefined' && (window as any).api?.products?.getAll) {
        const response = await (window as any).api.products.getAll();
        if (response.success && response.data) {
          const existingForCategory = response.data.filter(
            (p: any) => (p.category || 'Uncategorized') === category && 
                       p.sku && p.sku.startsWith(`${prefix}-`)
          );
          const skuCounter = existingForCategory.length;
          const generatedSku = `${prefix}-${skuCounter.toString().padStart(3, '0')}`;
          setFormData(prev => ({
            ...prev,
            sku: generatedSku
          }));
          return;
        }
      }
      
      // Fallback to IndexedDB only if SQLite not available
      const allProducts = await dbService.getProducts();
      const existingForCategory = allProducts.filter(
        (p) => p.category === category && p.sku && p.sku.startsWith(`${prefix}-`)
      );
      const skuCounter = existingForCategory.length;
      const generatedSku = `${prefix}-${skuCounter.toString().padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        sku: generatedSku
      }));
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Default SKU if error
      setFormData(prev => ({
        ...prev,
        sku: `${prefix}-000`
      }));
    }
  };

  const handleRestockFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRestockData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setFormData(prev => ({
          ...prev,
          imageUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const parsedStock = parseInt(formData.stock) || 0;
      const normalizedStock = parsedStock === 0 ? 1 : parsedStock;

      // Generate batch number
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const datePart = `${mm}${dd}${yy}`;
      const generatedBatchNo = `BT-${Date.now()}-${datePart}`;

      // Save to SQLite database (single source of truth)
      if (typeof window !== 'undefined' && (window as any).api?.products?.create) {
        // Use nullish coalescing to preserve 0 values
        const costValue = formData.cost ? parseFloat(formData.cost) : 0;
        const priceValue = formData.price ? parseFloat(formData.price) : 0;
        const minStockValue = formData.minStock ? parseInt(formData.minStock) : 0;
        
        const response = await (window as any).api.products.create({
          name: formData.name.trim(),
          sku: formData.sku || undefined,
          barcode: formData.barcode || undefined,
          category: formData.category || undefined,
          cost: isNaN(costValue) ? 0 : costValue,
          price: isNaN(priceValue) ? 0 : priceValue,
          minStock: isNaN(minStockValue) ? 0 : minStockValue,
          imageUrl: formData.imageUrl || undefined,
          batchNo: generatedBatchNo,
          stock: normalizedStock,
          expiryDate: formData.expiryDate || undefined,
        });

        if (response.success) {
          console.log('Product created successfully in SQLite:', response.data);
          toast.success('Product added successfully');
          // Small delay to ensure database write is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          onProductAdded();
          onClose();
          // Reset form
          setFormData({
            name: '',
            sku: '',
            category: '',
            supplier: '',
            cost: '',
            price: '',
            stock: '',
            minStock: '',
            expiryDate: '',
            batchNo: '',
            barcode: '',
            imageUrl: ''
          });
        } else {
          throw new Error(response.message || 'Failed to add product');
        }
      } else {
        // Fallback to IndexedDB if Electron API not available (web mode)
        const costValue = formData.cost ? parseFloat(formData.cost) : 0;
        const priceValue = formData.price ? parseFloat(formData.price) : 0;
        const minStockValue = formData.minStock ? parseInt(formData.minStock) : 0;
        
        await dbService.addProduct({
          ...formData,
          sku: formData.sku,
          cost: isNaN(costValue) ? 0 : costValue,
          price: isNaN(priceValue) ? 0 : priceValue,
          stock: normalizedStock,
          minStock: isNaN(minStockValue) ? 0 : minStockValue,
          batchNo: generatedBatchNo,
          status: normalizedStock > 0 ? 'In Stock' : 'Out of Stock',
        });
        toast.success('Product added successfully (local only)');
        onProductAdded();
        onClose();
        setFormData({
          name: '',
          sku: '',
          category: '',
          supplier: '',
          cost: '',
          price: '',
          stock: '',
          minStock: '',
          expiryDate: '',
          batchNo: '',
          barcode: '',
          imageUrl: ''
        });
      }
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingProduct) return;

    setIsRestocking(true);
    try {
      const additionalStock = parseInt(restockData.stock) || 0;
      if (additionalStock <= 0) {
        toast.error('Please enter a valid stock quantity');
        return;
      }

      // Generate batch number
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const datePart = `${mm}${dd}${yy}`;
      const generatedBatchNo = restockData.batchNo || `BT-${Date.now()}-${datePart}`;

      // Add batch to existing product in SQLite
      if (typeof window !== 'undefined' && (window as any).api?.products?.addBatch) {
        // First, find the product ID from SQLite by name or barcode
        const productsResponse = await (window as any).api.products.getAll();
        if (productsResponse.success && productsResponse.data) {
          const product = productsResponse.data.find((p: any) => 
            p.name === existingProduct.name || p.barcode === existingProduct.barcode
          );
          
          if (product) {
            const batchResponse = await (window as any).api.products.addBatch(product.id, {
              batchNo: generatedBatchNo,
              stock: additionalStock,
              expiryDate: restockData.expiryDate || existingProduct.expiryDate,
              cost: existingProduct.cost,
            });

            if (batchResponse.success) {
              // Record restock in IndexedDB history for the Restock page
              await dbService.addRestockRecord({
                productId: existingProduct.id,
                productName: existingProduct.name,
                originalSku: existingProduct.sku,
                restockSku: existingProduct.sku,
                quantity: additionalStock,
                batchNo: generatedBatchNo,
                expiryDate: restockData.expiryDate || existingProduct.expiryDate || '',
                barcode: restockData.barcode || existingProduct.barcode,
              });

              toast.success('Product restocked successfully');
              onProductAdded();
              setIsRestockDialogOpen(false);
              setRestockData({ stock: '', batchNo: '', expiryDate: '', barcode: '' });
              onClose();
            } else {
              throw new Error(batchResponse.message || 'Failed to add batch');
            }
          } else {
            // Product not found in SQLite, create it
            const createResponse = await (window as any).api.products.create({
              name: existingProduct.name,
              sku: existingProduct.sku,
              barcode: restockData.barcode || existingProduct.barcode,
              category: existingProduct.category,
              cost: existingProduct.cost,
              price: existingProduct.price,
              minStock: existingProduct.minStock,
              batchNo: generatedBatchNo,
              stock: additionalStock,
              expiryDate: restockData.expiryDate || existingProduct.expiryDate,
            });

            if (createResponse.success) {
              // Record restock in IndexedDB history for the Restock page
              await dbService.addRestockRecord({
                productId: existingProduct.id,
                productName: existingProduct.name,
                originalSku: existingProduct.sku,
                restockSku: existingProduct.sku,
                quantity: additionalStock,
                batchNo: generatedBatchNo,
                expiryDate: restockData.expiryDate || existingProduct.expiryDate || '',
                barcode: restockData.barcode || existingProduct.barcode,
              });

              toast.success('Product restocked successfully');
              onProductAdded();
              setIsRestockDialogOpen(false);
              setRestockData({ stock: '', batchNo: '', expiryDate: '', barcode: '' });
              onClose();
            } else {
              throw new Error(createResponse.message || 'Failed to create product');
            }
          }
        } else {
          throw new Error('Failed to fetch products');
        }
      } else {
        // Fallback to IndexedDB
        const restockSku = `${existingProduct.sku}-RS-${Date.now()}`;
        await dbService.addProduct({
          name: existingProduct.name,
          sku: restockSku,
          category: existingProduct.category,
          supplier: existingProduct.supplier,
          cost: existingProduct.cost,
          price: existingProduct.price,
          stock: additionalStock,
          minStock: existingProduct.minStock,
          expiryDate: restockData.expiryDate || existingProduct.expiryDate,
          status: additionalStock > 0 ? 'In Stock' : 'Out of Stock',
          batchNo: generatedBatchNo,
          barcode: restockData.barcode,
          imageUrl: existingProduct.imageUrl,
        });

        // Record restock in IndexedDB history for the Restock page
        await dbService.addRestockRecord({
          productId: existingProduct.id,
          productName: existingProduct.name,
          originalSku: existingProduct.sku,
          restockSku,
          quantity: additionalStock,
          batchNo: generatedBatchNo,
          expiryDate: restockData.expiryDate || existingProduct.expiryDate || '',
          barcode: restockData.barcode || existingProduct.barcode,
        });

        toast.success('Product restocked successfully (local only)');
        onProductAdded();
        setIsRestockDialogOpen(false);
        setRestockData({ stock: '', batchNo: '', expiryDate: '', barcode: '' });
        onClose();
      }
    } catch (error: any) {
      console.error('Error restocking product:', error);
      toast.error(error.message || 'Failed to restock product');
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                ref={nameInputRef}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Organic Green Tea"
              />
              {existingProduct && (
                <p className="text-xs text-muted-foreground mt-1">
                  A product with this name already exists.{' '}
                  <button
                    type="button"
                    className="text-primary underline font-medium"
                    onClick={() => setIsRestockDialogOpen(true)}
                  >
                    Restock this product
                  </button>
                  .
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                readOnly
                required
                placeholder="Auto-generated based on category"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Supplements">Supplements</SelectItem>
                  <SelectItem value="Snacks">Snacks</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Tea Co."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₱) *</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (₱) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                readOnly
                required
                placeholder="Auto-calculated from cost"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock Level</Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batchNo">Batch Number</Label>
              <Input
                id="batchNo"
                name="batchNo"
                value={formData.batchNo}
                readOnly
                placeholder="Auto-generated on save"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                ref={barcodeInputRef}
                value={formData.barcode}
                onChange={handleChange}
                placeholder="e.g., 123456789012"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Product Image (optional)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <Dialog open={isRestockDialogOpen && !!existingProduct} onOpenChange={(open) => { if (!open) setIsRestockDialogOpen(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restock Product</DialogTitle>
        </DialogHeader>
        {existingProduct && (
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="font-medium">{existingProduct.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-stock">Quantity to add *</Label>
              <Input
                id="restock-stock"
                name="stock"
                type="number"
                min="0"
                value={restockData.stock}
                onChange={handleRestockFieldChange}
                required
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-batchNo">Batch Number</Label>
              <Input
                id="restock-batchNo"
                name="batchNo"
                value={restockData.batchNo}
                readOnly
                placeholder="Auto-generated on restock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-expiryDate">Expiry Date</Label>
              <Input
                id="restock-expiryDate"
                name="expiryDate"
                type="date"
                value={restockData.expiryDate}
                onChange={handleRestockFieldChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restock-barcode">Barcode</Label>
              <Input
                id="restock-barcode"
                name="barcode"
                value={restockData.barcode}
                onChange={handleRestockFieldChange}
                placeholder="e.g., 123456789012"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRestockDialogOpen(false)}
                disabled={isRestocking}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRestocking}>
                {isRestocking ? 'Restocking...' : 'Restock'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  </>
  );
}
