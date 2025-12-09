import { ipcMain } from 'electron';
import { getProducts, getProductByBarcode, getInventoryItems, upsertInventoryProducts, getInventoryMirror, deleteInventoryProduct } from '../db/queries';

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
