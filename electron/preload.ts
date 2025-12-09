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
    getMirror: () => ipcRenderer.invoke('inventory:getMirror'),
    delete: (id: string) => ipcRenderer.invoke('inventory:delete', id),
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
    };
  }
}
