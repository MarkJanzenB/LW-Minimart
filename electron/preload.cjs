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
  products: {
    getAll: () => ipcRenderer.invoke("products:getAll"),
    getByBarcode: (barcode) => ipcRenderer.invoke("products:getByBarcode", barcode),
    getInventory: () => ipcRenderer.invoke("products:getInventory"),
  },
  transactions: {
    getAll: (limit, offset) => ipcRenderer.invoke("transactions:getAll", limit, offset),
    getById: (transactionId) => ipcRenderer.invoke("transactions:getById", transactionId),
    create: (transactionData) => ipcRenderer.invoke("transactions:create", transactionData),
  },
});
