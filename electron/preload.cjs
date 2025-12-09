const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (username, password) =>
      ipcRenderer.invoke("auth:login", { username, password }),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    register: (username, password, role) =>
      ipcRenderer.invoke("auth:register", { username, password, role }),
    hasOwner: () => ipcRenderer.invoke("auth:hasOwner"),
    initializeOwner: (username, password) =>
      ipcRenderer.invoke("auth:initializeOwner", { username, password }),
  },
  inventory: {
    syncFromClient: (products) =>
      ipcRenderer.invoke("inventory:syncFromClient", products),
    getMirror: () => ipcRenderer.invoke("inventory:getMirror"),
    delete: (id) => ipcRenderer.invoke("inventory:delete", id),
  db: {
    recordSale: (transaction) => ipcRenderer.invoke("db:recordSale", transaction),
    getSalesWithItems: () => ipcRenderer.invoke("db:getSalesWithItems"),
  },
});
