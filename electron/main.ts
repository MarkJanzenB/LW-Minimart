import { app, BrowserWindow } from "electron";
import { join } from "path";
import { registerAuthIpc } from "./ipc/auth";
import { registerDbIpc } from "./ipc/db";
import { db } from "./db/db"; // Use the centralized db instance

let mainWindow: BrowserWindow | null = null;

// Seed the database with some data
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  console.log('Seeding database...');
  const products = [
    { name: 'Apple', barcode: '1234567890123', price: 1.5, category: 'Fruit', stock: 100 },
    { name: 'Banana', barcode: '1234567890124', price: 0.5, category: 'Fruit', stock: 150 },
    { name: 'Milk', barcode: '1234567890125', price: 3.0, category: 'Dairy', stock: 50 },
    { name: 'Bread', barcode: '1234567890126', price: 2.5, category: 'Bakery', stock: 75 },
    { name: 'Eggs', barcode: '1234567890127', price: 2.0, category: 'Dairy', stock: 200 },
  ];

  const productStmt = db.prepare('INSERT INTO products (name, barcode, selling_price) VALUES (?, ?, ?)');
  const batchStmt = db.prepare('INSERT INTO batches (product_id, quantity) VALUES (?, ?)');

  const seedTransaction = db.transaction((prods) => {
    for (const p of prods) {
      const info = productStmt.run(p.name, p.barcode, p.price);
      batchStmt.run(info.lastInsertRowid, p.stock);
    }
  });

  seedTransaction(products);
}

// Initialize IPC handlers
registerAuthIpc(db);
registerDbIpc();

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
