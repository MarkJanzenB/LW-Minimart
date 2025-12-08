import { ipcMain } from 'electron';
import { getProducts } from '../db/queries';

ipcMain.handle('get-products', async () => {
  try {
    const products = await getProducts();
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    throw new Error('Failed to get products');
  }
});
