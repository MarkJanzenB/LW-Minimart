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
    };
  }
}

export {};
