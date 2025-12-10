import type { Product } from "./services/database";

declare global {
  interface Window {
    api: {
      auth: {
        login(username: string, password: string): Promise<{ success: boolean; message?: string }>;
        getCurrentUser(): Promise<{ user: { username: string; role: "owner" | "cashier" } | null }>;
        logout(): Promise<{ success: boolean }>;
        register(
          username: string,
          password: string,
          role?: "owner" | "cashier"
        ): Promise<{ success: boolean; message?: string }>;
        hasOwner(): Promise<{ hasOwner: boolean }>;
        initializeOwner(
          username: string,
          password: string
        ): Promise<{ success: boolean; message?: string }>;
      };
      inventory: {
        syncFromClient(products: Product[]): Promise<void>;
        getMirror(): Promise<Product[]>;
        delete(id: string): Promise<void>;
      };
      db: {
        recordSale(
          transaction: unknown
        ): Promise<{ success: boolean; data?: { saleId: number }; message?: string }>;
        getSalesWithItems(): Promise<{
          success: boolean;
          data?: any[];
          message?: string;
        }>;
      };
      products: {
        getAll(): Promise<{ success: boolean; data?: any[]; message?: string }>;
        getByBarcode(barcode: string): Promise<{ success: boolean; data?: any; message?: string }>;
        getInventory(): Promise<{ success: boolean; data?: any[]; message?: string }>;
        create(productData: any): Promise<{ success: boolean; data?: any; message?: string }>;
        update(productId: number, productData: any): Promise<{ success: boolean; data?: any; message?: string }>;
        addBatch(productId: number, batchData: any): Promise<{ success: boolean; data?: any; message?: string }>;
        delete(productId: number): Promise<{ success: boolean; message?: string }>;
      };
      transactions: {
        getAll(limit?: number, offset?: number): Promise<{ success: boolean; data?: any[]; message?: string }>;
        getById(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }>;
        create(transactionData: any): Promise<{ success: boolean; data?: any; message?: string }>;
      };
      dashboard: {
        getMetrics(): Promise<{ success: boolean; data?: any; message?: string }>;
      };
    };
  }
}

export {};
