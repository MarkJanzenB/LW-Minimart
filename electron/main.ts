import { app, BrowserWindow } from "electron";
import { join } from "path";
import { registerAuthIpc } from "./ipc/auth";
import { db } from "./db/db";
import "./ipc/products";

let mainWindow: BrowserWindow | null = null;

const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insert = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  insert.run("owner@test.com", "owner123", "owner");
  insert.run("cashier@test.com", "cashier123", "cashier");
}

registerAuthIpc(db);

const isDev = process.env.ELECTRON_DEV === "true";

function createWindow() {
  console.log('Creating browser window...');
  console.log('Is dev mode:', isDev);
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false, // For development only
    },
    show: false,
  });
  
  // Open dev tools for debugging
  mainWindow.webContents.openDevTools();

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    const devUrl = "http://localhost:5173";
    console.log('Loading URL:', devUrl);
    mainWindow.loadURL(devUrl).catch(err => {
      console.error('Failed to load URL:', err);
    });
  } else {
    mainWindow.loadFile(join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
