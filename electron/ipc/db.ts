import { ipcMain } from 'electron';
import {
  getProducts,
  getProductByBarcode,
  recordSale,
} from '../db/queries';

export function registerDbIpc() {
  ipcMain.handle('db:getProducts', () => {
    try {
      const products = getProducts();
      return { success: true, data: products };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('db:getProductByBarcode', (event, barcode) => {
    try {
      const product = getProductByBarcode(barcode);
      return { success: true, data: product };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('db:recordSale', (event, transaction) => {
    try {
      const saleId = recordSale(transaction);
      return { success: true, data: { saleId } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}
