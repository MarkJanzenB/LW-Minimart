// Development preload for Electron (CommonJS).
// This mirrors the logic in electron/preload.ts but avoids using ts-node
// so that Electron can load it directly as a plain JS file.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (username, password) =>
      ipcRenderer.invoke("auth:login", { username, password }),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
    logout: () => ipcRenderer.invoke("auth:logout"),
  },
});
