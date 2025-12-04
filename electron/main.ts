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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:8080");
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
