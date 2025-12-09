import { contextBridge, ipcRenderer } from "electron";

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
  products: {
    getAll: () => ipcRenderer.invoke("products:getAll"),
    getByBarcode: (barcode: string) => ipcRenderer.invoke("products:getByBarcode", barcode),
    getInventory: () => ipcRenderer.invoke("products:getInventory"),
  },
  transactions: {
    getAll: (limit?: number, offset?: number) => ipcRenderer.invoke("transactions:getAll", limit, offset),
    getById: (transactionId: string) => ipcRenderer.invoke("transactions:getById", transactionId),
    create: (transactionData: any) => ipcRenderer.invoke("transactions:create", transactionData),
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
      products: {
        getAll(): Promise<{ success: boolean; data?: any[]; message?: string }>;
        getByBarcode(barcode: string): Promise<{ success: boolean; data?: any; message?: string }>;
        getInventory(): Promise<{ success: boolean; data?: any[]; message?: string }>;
      };
      transactions: {
        getAll(limit?: number, offset?: number): Promise<{ success: boolean; data?: any[]; message?: string }>;
        getById(transactionId: string): Promise<{ success: boolean; data?: any; message?: string }>;
        create(transactionData: any): Promise<{ success: boolean; data?: any; message?: string }>;
      };
    };
  }
}
