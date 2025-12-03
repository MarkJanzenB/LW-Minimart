const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (username, password) =>
      ipcRenderer.invoke("auth:login", { username, password }),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
    logout: () => ipcRenderer.invoke("auth:logout"),
    register: (username, password, role) =>
      ipcRenderer.invoke("auth:register", { username, password, role }),
  },
});
