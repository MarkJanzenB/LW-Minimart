import { Product, Transaction } from '@/integrations/supabase/types';

declare global {
  interface Window {
    api: {
      db: {
        getProducts(): Promise<{ success: boolean; data: Product[]; message?: string }>;
        getProductByBarcode(barcode: string): Promise<{ success: boolean; data: Product | null; message?: string }>;
        recordSale(transaction: Transaction): Promise<{ success: boolean; data: { saleId: number }; message?: string }>;
      };
    };
  }
}
