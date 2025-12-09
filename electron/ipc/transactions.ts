import { ipcMain } from 'electron';
import { getTransactions, getTransactionById, createTransaction } from '../db/queries';

export function registerTransactionsIpc() {
  ipcMain.handle('transactions:getAll', (_event, limit?: number, offset?: number) => {
    try {
      return { success: true, data: getTransactions(limit, offset) };
    } catch (error: any) {
      console.error('Failed to get transactions:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('transactions:getById', (_event, transactionId: string) => {
    try {
      const transaction = getTransactionById(transactionId);
      return { success: true, data: transaction || null };
    } catch (error: any) {
      console.error('Failed to get transaction:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('transactions:create', (_event, transactionData: any) => {
    try {
      const result = createTransaction(transactionData);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      return { success: false, message: error.message };
    }
  });
}

