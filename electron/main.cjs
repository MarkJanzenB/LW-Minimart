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

// ---- Product IPC (SQLite-backed) ----
ipcMain.handle("products:getAll", () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        COALESCE(SUM(b.quantity), 0) AS stock_quantity
      FROM products p
      LEFT JOIN batches b ON b.product_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `);
    return { success: true, data: stmt.all() };
  } catch (error) {
    console.error("Failed to get products:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("products:getByBarcode", (_event, barcode) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        COALESCE(SUM(b.quantity), 0) AS stock_quantity
      FROM products p
      LEFT JOIN batches b ON b.product_id = p.id
      WHERE p.barcode = ?
      GROUP BY p.id
      LIMIT 1
    `);
    const product = stmt.get(barcode);
    return { success: true, data: product || null };
  } catch (error) {
    console.error("Failed to get product by barcode:", error);
    return { success: false, message: error.message };
  }
});

// ---- Sales IPC ----
ipcMain.handle("db:getSalesWithItems", () => {
  try {
    const salesStmt = db.prepare(`
      SELECT
        s.id,
        s.transaction_date,
        s.total_amount,
        s.payment_method,
        s.cash_received,
        s.change,
        s.reference_number
      FROM sales s
      ORDER BY s.transaction_date DESC
    `);

    const itemsStmt = db.prepare(`
      SELECT
        si.sale_id,
        si.product_id,
        si.quantity,
        si.price,
        p.name,
        p.sku,
        p.barcode
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = ?
    `);

    const sales = salesStmt.all();
    const result = sales.map((sale) => ({
      ...sale,
      items: itemsStmt.all(sale.id),
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get sales with items:", error);
    return { success: false, message: error.message };
  }
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
