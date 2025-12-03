import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { registerAuthIpc } from "./ipc/auth";

const isDev = process.env.VITE_DEV_SERVER_URL != null;

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: isDev
        ? path.join(__dirname, "preload-dev.cjs")
        : path.join(__dirname, "preload.js"),
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexHtml = path.join(__dirname, "../dist/index.html");
    await mainWindow.loadFile(indexHtml);
  }
}

app.whenReady().then(async () => {
  registerAuthIpc();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
