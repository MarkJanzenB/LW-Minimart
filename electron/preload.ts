import { contextBridge, ipcRenderer } from "electron";
import type { Product } from "../src/services/database";

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke("auth:login", { username, password }),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    register: (username: string, password: string, role?: "owner" | "cashier") =>
      ipcRenderer.invoke("auth:register", { username, password, role }),
    hasOwner: () => ipcRenderer.invoke("auth:hasOwner"),
    initializeOwner: (username: string, password: string) =>
      ipcRenderer.invoke("auth:initializeOwner", { username, password }),
  },
  inventory: {
    syncFromClient: (products: Product[]) =>
      ipcRenderer.invoke("inventory:syncFromClient", products),
    getMirror: () => ipcRenderer.invoke("inventory:getMirror"),
    delete: (id: string) => ipcRenderer.invoke("inventory:delete", id),
  },
  db: {
    recordSale: (transaction: unknown) =>
      ipcRenderer.invoke("db:recordSale", transaction),
    getSalesWithItems: () =>
      ipcRenderer.invoke("db:getSalesWithItems"),
  },
  products: {
    getAll: () => ipcRenderer.invoke("products:getAll"),
    getByBarcode: (barcode: string) => ipcRenderer.invoke("products:getByBarcode", barcode),
    getInventory: () => ipcRenderer.invoke("products:getInventory"),
    create: (productData: any) => ipcRenderer.invoke("products:create", productData),
    update: (productId: number, productData: any) => ipcRenderer.invoke("products:update", productId, productData),
    addBatch: (productId: number, batchData: any) => ipcRenderer.invoke("products:addBatch", productId, batchData),
    delete: (productId: number) => ipcRenderer.invoke("products:delete", productId),
  },
  transactions: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke("transactions:getAll", limit, offset),
    getById: (transactionId: string) => ipcRenderer.invoke("transactions:getById", transactionId),
    create: (transactionData: any) => ipcRenderer.invoke("transactions:create", transactionData),
  },
  dashboard: {
    getMetrics: () => ipcRenderer.invoke("dashboard:getMetrics"),
  },
});

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
  spoilage: {
    moveToSpoilage(productId: number, quantity: number, reason?: string): Promise<{ success: boolean; data?: any; message?: string }>;
    getAll(limit?: number, offset?: number): Promise<{ success: boolean; data?: any[]; message?: string }>;
    getStats(): Promise<{ success: boolean; data?: any; message?: string }>;
  };
    };
  }
}
