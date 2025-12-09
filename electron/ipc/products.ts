import { ipcMain } from 'electron';
import { getProducts, upsertInventoryProducts, getInventoryMirror, deleteInventoryProduct } from '../db/queries';

ipcMain.handle('get-products', async () => {
  try {
    const products = await getProducts();
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    throw new Error('Failed to get products');
  }
});

ipcMain.handle('inventory:syncFromClient', async (_event, products) => {
  try {
    upsertInventoryProducts(products || []);
    return { success: true };
  } catch (error) {
    console.error('Failed to sync inventory to SQLite:', error);
    throw new Error('Failed to sync inventory');
  }
});

ipcMain.handle('inventory:getMirror', async () => {
  try {
    const products = getInventoryMirror();
    return products;
  } catch (error) {
    console.error('Failed to get inventory mirror:', error);
    throw new Error('Failed to get inventory mirror');
  }
});

ipcMain.handle('inventory:delete', async (_event, id: string) => {
  try {
    deleteInventoryProduct(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete inventory product from mirror:', error);
    throw new Error('Failed to delete inventory product');
  }
});
