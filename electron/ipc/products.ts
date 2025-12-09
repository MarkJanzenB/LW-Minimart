import { ipcMain } from 'electron';
import { getProducts, getProductByBarcode, getInventoryItems } from '../db/queries';

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
}
