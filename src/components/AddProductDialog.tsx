import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { dbService, Product } from '@/services/database';
import { toast } from 'sonner';

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
        const sellingPrice = costNumber + costNumber * 0.5;
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
    const allProducts = await dbService.getProducts();
    const skuPrefixMap: Record<string, string> = {
      Beverages: 'B',
      Food: 'F',
      Supplements: 'SU',
      Snacks: 'SN',
      Other: 'O',
    };
    const prefix = skuPrefixMap[category] ?? 'O';
    const existingForCategory = allProducts.filter(
      (p) => p.category === category && p.sku.startsWith(`${prefix}-`)
    );
    const skuCounter = existingForCategory.length;
    const generatedSku = `${prefix}-${skuCounter.toString().padStart(3, '0')}`;
    setFormData(prev => ({
      ...prev,
      sku: generatedSku
    }));
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

      const allProducts = await dbService.getProducts();
      const trimmedName = formData.name.trim().toLowerCase();
      const existingCountForName = allProducts.filter(
        (p) => p.name.trim().toLowerCase() === trimmedName
      ).length;

      const counter = existingCountForName + 1;
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const datePart = `${mm}${dd}${yy}`;
      const generatedBatchNo = `BT-${counter}-${datePart}`;

      await dbService.addProduct({
        ...formData,
        sku: formData.sku,
        cost: parseFloat(formData.cost) || 0,
        price: parseFloat(formData.price) || 0,
        stock: normalizedStock,
        minStock: parseInt(formData.minStock) || 0,
        batchNo: generatedBatchNo,
        status: normalizedStock > 0 ? 'In Stock' : 'Out of Stock',
      });
      
      toast.success('Product added successfully');
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
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
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

      // Ensure we don't violate the unique SKU index in IndexedDB.
      // For restock batches we generate a distinct SKU, while the
      // Inventory UI groups by name and ignores SKU.
      const restockSku = `${existingProduct.sku}-RS-${Date.now()}`;

      const allProducts = await dbService.getProducts();
      const trimmedName = existingProduct.name.trim().toLowerCase();
      const existingCountForName = allProducts.filter(
        (p) => p.name.trim().toLowerCase() === trimmedName
      ).length;

      const counter = existingCountForName + 1;
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const datePart = `${mm}${dd}${yy}`;
      const generatedBatchNo = `BT-${counter}-${datePart}`;

      const newProductId = await dbService.addProduct({
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

      await dbService.addRestockRecord({
        productId: existingProduct.id,
        productName: existingProduct.name,
        originalSku: existingProduct.sku,
        restockSku,
        quantity: additionalStock,
        batchNo: generatedBatchNo,
        expiryDate: restockData.expiryDate || existingProduct.expiryDate,
        barcode: restockData.barcode,
      });

      toast.success('Product restocked successfully');
      onProductAdded();
      setIsRestockDialogOpen(false);
      setRestockData({ stock: '', batchNo: '', expiryDate: '', barcode: '' });
      onClose();
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error('Failed to restock product');
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
              <div className="flex gap-2">
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
                  onClick={() => {}}
                >
                  Scan Barcode
                </Button>
              </div>
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
                onChange={handleRestockFieldChange}
                placeholder="e.g., BT-2024-001"
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
