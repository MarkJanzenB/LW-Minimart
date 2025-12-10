import { ipcMain } from 'electron';
import { 
  getProducts, 
  getProductByBarcode, 
  getInventoryItems, 
  createProduct,
  updateProduct,
  addBatchToProduct,
  getOrCreateCategory,
  deleteProduct,
  upsertInventoryProducts, 
  getInventoryMirror, 
  deleteInventoryProduct,
  updateProductBatchesExpiry,
} from '../db/queries';

export function registerProductsIpc() {
  ipcMain.handle('products:getAll', () => {
    try {
      return { success: true, data: getProducts() };
    } catch (error: any) {
      console.error('Failed to get products:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:getByBarcode', (_event, barcode: string) => {
    try {
      const product = getProductByBarcode(barcode);
      return { success: true, data: product || null };
    } catch (error: any) {
      console.error('Failed to get product by barcode:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:getInventory', () => {
    try {
      return { success: true, data: getInventoryItems() };
    } catch (error: any) {
      console.error('Failed to get inventory items:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:create', (_event, productData: any) => {
    try {
      // Handle category - get or create it
      let categoryId: number | undefined;
      if (productData.category) {
        categoryId = getOrCreateCategory(productData.category);
      }

      const result = createProduct({
        name: productData.name,
        sku: productData.sku,
        barcode: productData.barcode,
        description: productData.description,
        category_id: categoryId,
        supplier_id: productData.supplier_id,
        unit_id: productData.unit_id,
        purchase_price: productData.cost ?? productData.purchase_price ?? 0,
        selling_price: productData.price ?? productData.selling_price ?? 0,
        reorder_threshold: productData.minStock ?? productData.reorder_threshold ?? 0,
        image_url: productData.imageUrl ?? productData.image_url,
        batch_code: productData.batchNo ?? productData.batch_code,
        quantity: productData.stock ?? productData.quantity ?? 0,
        expiry_date: productData.expiryDate ?? productData.expiry_date,
        cost_per_unit: productData.cost ?? productData.purchase_price ?? 0,
      });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to create product:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:update', (_event, productId: number, productData: any) => {
    try {
      let categoryId: number | undefined;
      if (productData.category) {
        categoryId = getOrCreateCategory(productData.category);
      }

      const updateData: any = {};
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.sku !== undefined) updateData.sku = productData.sku;
      if (productData.barcode !== undefined) updateData.barcode = productData.barcode;
      if (productData.description !== undefined) updateData.description = productData.description;
      if (categoryId !== undefined) updateData.category_id = categoryId;
      if (productData.supplier_id !== undefined) updateData.supplier_id = productData.supplier_id;
      if (productData.unit_id !== undefined) updateData.unit_id = productData.unit_id;
      if (productData.cost !== undefined || productData.purchase_price !== undefined) {
        updateData.purchase_price = productData.cost ?? productData.purchase_price;
      }
      if (productData.price !== undefined || productData.selling_price !== undefined) {
        updateData.selling_price = productData.price ?? productData.selling_price;
      }
      if (productData.minStock !== undefined || productData.reorder_threshold !== undefined) {
        updateData.reorder_threshold = productData.minStock ?? productData.reorder_threshold;
      }
      if (productData.imageUrl !== undefined || productData.image_url !== undefined) {
        updateData.image_url = productData.imageUrl ?? productData.image_url;
      }
      if (productData.is_active !== undefined) updateData.is_active = productData.is_active;
      // If expiry date is provided, update all batches for this product
      const expiryDate = productData.expiryDate ?? productData.expiry_date;
      if (expiryDate !== undefined) {
        updateProductBatchesExpiry(productId, expiryDate || null);
      }

      const result = updateProduct(productId, updateData);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to update product:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:addBatch', (_event, productId: number, batchData: any) => {
    try {
      const result = addBatchToProduct(productId, {
        batch_code: batchData.batchNo ?? batchData.batch_code,
        quantity: batchData.stock ?? batchData.quantity ?? 0,
        expiry_date: batchData.expiryDate ?? batchData.expiry_date,
        cost_per_unit: batchData.cost ?? batchData.cost_per_unit ?? 0,
      });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to add batch:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('products:delete', (_event, productId: number) => {
    try {
      deleteProduct(productId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      return { success: false, message: error.message };
    }
  });

  // Legacy inventory mirror handlers (if still needed)
  ipcMain.handle('inventory:syncFromClient', (_event, products) => {
    try {
      upsertInventoryProducts(products || []);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to sync inventory to SQLite:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('inventory:getMirror', () => {
    try {
      const products = getInventoryMirror();
      return { success: true, data: products };
    } catch (error: any) {
      console.error('Failed to get inventory mirror:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('inventory:delete', (_event, id: string) => {
    try {
      deleteInventoryProduct(id);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete inventory product from mirror:', error);
      return { success: false, message: error.message };
    }
  });
}
