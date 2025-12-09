const { app, BrowserWindow, ipcMain } = require("electron");
const { join } = require("path");
const { readFileSync, mkdirSync } = require("fs");
const Database = require("better-sqlite3");
const { registerAuthIpc } = require("./ipc/auth.cjs");

// Suppress cache-related console errors (these are harmless warnings)
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || "";
  // Filter out cache-related errors
  if (
    message.includes("Unable to move the cache") ||
    message.includes("Unable to create cache") ||
    message.includes("Gpu Cache Creation failed") ||
    message.includes("disk_cache")
  ) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

let mainWindow = null;

// Use the same database setup as db.ts - apply schema from schema.sql
const dbDir = join(__dirname, "db");
mkdirSync(dbDir, { recursive: true });
const dbPath = join(dbDir, "store.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('owner','cashier'))
  );

  CREATE TABLE IF NOT EXISTS inventory_mirror (
    id TEXT PRIMARY KEY,
    name TEXT,
    sku TEXT,
    category TEXT,
    supplier TEXT,
    cost REAL,
    price REAL,
    stock INTEGER,
    minStock INTEGER,
    expiryDate TEXT,
    status TEXT,
    batchNo TEXT,
    barcode TEXT,
    imageUrl TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
`);

// Apply schema from schema.sql file
try {
  const schemaPath = join(dbDir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  if (schema && schema.trim().length > 0) {
    db.exec(schema);
  }
} catch (e) {
  console.error("Failed to apply database schema:", e);
}

// No default users - users must be created through owner-setup
registerAuthIpc(db);

// Inventory mirror IPC
ipcMain.handle("inventory:syncFromClient", (_event, products) => {
  const deleteAll = db.prepare("DELETE FROM inventory_mirror");
  const insert = db.prepare(`
    INSERT INTO inventory_mirror (
      id,
      name,
      sku,
      category,
      supplier,
      cost,
      price,
      stock,
      minStock,
      expiryDate,
      status,
      batchNo,
      barcode,
      imageUrl,
      createdAt,
      updatedAt
    ) VALUES (
      @id,
      @name,
      @sku,
      @category,
      @supplier,
      @cost,
      @price,
      @stock,
      @minStock,
      @expiryDate,
      @status,
      @batchNo,
      @barcode,
      @imageUrl,
      @createdAt,
      @updatedAt
    )
  `);

  const transaction = db.transaction((rows) => {
    deleteAll.run();
    for (const row of rows || []) {
      insert.run(row);
    }
  });

  transaction(products || []);
  return { success: true };
});

ipcMain.handle("inventory:getMirror", () => {
  const stmt = db.prepare("SELECT * FROM inventory_mirror ORDER BY name");
  return stmt.all();
});

ipcMain.handle("inventory:delete", (_event, id) => {
  const stmt = db.prepare("DELETE FROM inventory_mirror WHERE id = ?");
  stmt.run(id);
  return { success: true };
});

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
    if (mainWindow) mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
