import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Product } from '@/services/database';
import { toast } from 'sonner';
import { Scan } from 'lucide-react';

interface EditProductDialogProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onProductUpdated: () => void;
  onProductDeleted: () => void;
}

export function EditProductDialog({
  isOpen,
  product,
  onClose,
  onProductUpdated,
  onProductDeleted,
}: EditProductDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
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
    imageUrl: '',
  });

  useEffect(() => {
    if (product) {
      // First, initialize form with passed product data immediately to avoid blank fields
      const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
      
      // Initialize with passed product data first
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        supplier: product.supplier || '',
        cost: product.cost != null && product.cost !== 0 ? String(product.cost) : (product.cost === 0 ? '0' : ''),
        price: product.price != null && product.price !== 0 ? String(product.price) : (product.price === 0 ? '0' : ''),
        stock: product.stock != null ? String(product.stock) : '',
        minStock: product.minStock != null ? String(product.minStock) : '',
        expiryDate: product.expiryDate || '',
        batchNo: product.batchNo || '',
        barcode: product.barcode || '',
        imageUrl: product.imageUrl || product.image_url || '',
      });

      // Then fetch full product data including cost from database
      const fetchFullProductData = async () => {
        try {
          if (isNaN(productId)) {
            console.warn('Invalid product ID, using passed product data as-is');
            return;
          }

          // Fetch from both sources to get all fields
          // products:getInventory has expiryDate
          // products:getAll has purchase_price
          const api = (window as any).api;
          if (!api?.products) {
            console.warn('Products API not available, using passed product data as-is');
            return;
          }

          let inventoryProduct: any = null;
          let allProductsProduct: any = null;

          // Fetch from inventory to get expiry date
          if (api.products.getInventory) {
            const inventoryResponse = await api.products.getInventory();
            if (inventoryResponse?.success && inventoryResponse.data) {
              inventoryProduct = inventoryResponse.data.find((p: any) => p.id === productId);
            }
          }

          // Fetch from all products to get purchase_price
          if (api.products.getAll) {
            const allResponse = await api.products.getAll();
            if (allResponse?.success && allResponse.data) {
              allProductsProduct = allResponse.data.find((p: any) => p.id === productId);
            }
          }

          // Update form with fetched data, preserving existing values as fallback
          if (inventoryProduct || allProductsProduct) {
            setFormData((prev) => ({
              ...prev,
              name: inventoryProduct?.name || allProductsProduct?.name || prev.name,
              sku: inventoryProduct?.sku || allProductsProduct?.sku || prev.sku,
              category: inventoryProduct?.category || allProductsProduct?.category || prev.category,
              cost: allProductsProduct?.purchase_price != null 
                ? String(allProductsProduct.purchase_price) 
                : prev.cost,
              price: inventoryProduct?.price != null 
                ? String(inventoryProduct.price) 
                : (allProductsProduct?.price != null ? String(allProductsProduct.price) : prev.price),
              stock: inventoryProduct?.stock != null 
                ? String(inventoryProduct.stock) 
                : (allProductsProduct?.stock != null ? String(allProductsProduct.stock) : prev.stock),
              minStock: inventoryProduct?.minStock != null 
                ? String(inventoryProduct.minStock) 
                : (allProductsProduct?.reorder_threshold != null 
                    ? String(allProductsProduct.reorder_threshold) 
                    : prev.minStock),
              expiryDate: inventoryProduct?.expiryDate || prev.expiryDate,
              batchNo: inventoryProduct?.batchNo || prev.batchNo,
              barcode: inventoryProduct?.barcode || allProductsProduct?.barcode || prev.barcode,
              imageUrl: inventoryProduct?.image_url || inventoryProduct?.imageUrl || 
                       allProductsProduct?.image_url || allProductsProduct?.imageUrl || prev.imageUrl,
            }));
          }
        } catch (error) {
          console.error('Error fetching full product data:', error);
          // Form already initialized with passed product data, so no need to reset
        }
      };

      void fetchFullProductData();
    } else {
      // Reset form when product is null
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
        imageUrl: '',
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
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
        setFormData((prev) => ({
          ...prev,
          imageUrl: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSaving(true);
    try {
      // Get product ID - handle both string and number IDs
      const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
      if (isNaN(productId)) {
        throw new Error('Invalid product ID');
      }

      // Prepare update data for SQLite - handle empty strings and zero values correctly
      const costValue = formData.cost !== '' && formData.cost !== null && formData.cost !== undefined 
        ? parseFloat(formData.cost) 
        : 0;
      const priceValue = formData.price !== '' && formData.price !== null && formData.price !== undefined 
        ? parseFloat(formData.price) 
        : 0;
      const minStockValue = formData.minStock !== '' && formData.minStock !== null && formData.minStock !== undefined 
        ? parseInt(formData.minStock) 
        : 0;

      const updateData: any = {
        name: formData.name.trim(),
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        category: formData.category || undefined,
        cost: isNaN(costValue) ? 0 : costValue,
        price: isNaN(priceValue) ? 0 : priceValue,
        minStock: isNaN(minStockValue) ? 0 : minStockValue,
        imageUrl: formData.imageUrl || undefined,
        // Pass expiry date so backend can update batches
        expiryDate: formData.expiryDate || undefined,
      };

      // Use SQLite API (single source of truth)
      if (typeof window !== 'undefined' && (window as any).api?.products?.update) {
        const response = await (window as any).api.products.update(productId, updateData);
        
        if (response && response.success) {
          console.log('Product updated successfully in SQLite:', response.data);
          toast.success('Product updated successfully');
          // Small delay to ensure database write is complete
          await new Promise(resolve => setTimeout(resolve, 100));
          onProductUpdated();
          onClose();
        } else {
          throw new Error(response?.message || 'Failed to update product');
        }
      } else {
        throw new Error('Product update API not available');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">Edit Product</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Update the product details below. Fields marked with <span className="text-red-500">*</span> are required.</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">
                Cost (₱) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Selling Price (₱) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                Current Stock <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
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
                // No min restriction - allow past dates for expired products
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNo">Batch Number</Label>
              <Input
                id="batchNo"
                name="batchNo"
                value={formData.batchNo}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="e.g., 123456789012"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {}}
                >
                  <Scan className="w-4 h-4" />
                  <span>Scan</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUrl">Product Image (optional)</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  {formData.imageUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-md border border-border"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a product image. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
