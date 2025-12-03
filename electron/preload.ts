import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke("auth:login", { username, password }),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    register: (username: string, password: string, role?: "owner" | "cashier") =>
      ipcRenderer.invoke("auth:register", { username, password, role }),
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
      };
    };
  }
}
