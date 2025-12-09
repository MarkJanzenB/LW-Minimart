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
// NOTE: Keep main process pure CJS; avoid importing TS modules here.

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

  -- POS transactions tables (separate from legacy sales tables)
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE,
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    payment_method TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price REAL DEFAULT 0,
    subtotal REAL DEFAULT 0,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
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

// POS / Transactions IPC
ipcMain.handle("transactions:getAll", (_event, limit, offset) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.transaction_id,
        t.subtotal,
        t.tax_amount,
        t.total_amount,
        t.payment_method,
        t.created_by,
        t.created_at
      FROM transactions t
      ORDER BY t.created_at DESC
      LIMIT COALESCE(?, -1) OFFSET COALESCE(?, 0)
    `);
    const rows = stmt.all(limit ?? -1, offset ?? 0);
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("transactions:getById", (_event, transactionId) => {
  try {
    const txnStmt = db.prepare(`
      SELECT 
        t.id,
        t.transaction_id,
        t.subtotal,
        t.tax_amount,
        t.total_amount,
        t.payment_method,
        t.created_by,
        t.created_at
      FROM transactions t
      WHERE t.transaction_id = ?
      LIMIT 1
    `);
    const itemStmt = db.prepare(`
      SELECT 
        ti.id,
        ti.product_id,
        ti.quantity,
        ti.unit_price,
        ti.subtotal
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      WHERE t.transaction_id = ?
    `);
    const txn = txnStmt.get(transactionId);
    if (!txn) return { success: true, data: null };
    const items = itemStmt.all(transactionId);
    return { success: true, data: { ...txn, items } };
  } catch (error) {
    console.error("Failed to get transaction:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("transactions:create", (_event, transactionData) => {
  try {
    const insertTxn = db.prepare(`
      INSERT INTO transactions (
        transaction_id,
        subtotal,
        tax_amount,
        total_amount,
        payment_method,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const txnResult = insertTxn.run(
      transactionData.transaction_id,
      transactionData.subtotal ?? 0,
      transactionData.tax_amount ?? 0,
      transactionData.total_amount ?? 0,
      transactionData.payment_method ?? "cash",
      transactionData.created_by ?? null
    );

    const txnId = txnResult.lastInsertRowid;

    if (Array.isArray(transactionData.items)) {
      const insertItem = db.prepare(`
        INSERT INTO transaction_items (
          transaction_id,
          product_id,
          quantity,
          unit_price,
          subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `);
      const updateBatch = db.prepare(`
        UPDATE batches
        SET quantity = quantity - ?
        WHERE id = ?
      `);
      const getBatches = db.prepare(`
        SELECT id, quantity 
        FROM batches 
        WHERE product_id = ?
        AND quantity > 0
        ORDER BY expiry_date ASC, created_at ASC
      `);

      for (const item of transactionData.items) {
        insertItem.run(
          txnId,
          item.product_id ?? item.id ?? null,
          item.quantity ?? 0,
          item.unit_price ?? item.price ?? 0,
          item.subtotal ?? (item.price ?? 0) * (item.quantity ?? 0)
        );

        // FIFO stock deduction
        let qty = item.quantity ?? 0;
        const batches = getBatches.all(item.product_id ?? item.id ?? null);
        for (const batch of batches) {
          if (qty <= 0) break;
          const deduct = Math.min(qty, batch.quantity);
          updateBatch.run(deduct, batch.id);
          qty -= deduct;
        }
      }
    }

    return { success: true, data: { id: txnId, transaction_id: transactionData.transaction_id } };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("dashboard:getMetrics", () => {
  try {
    const metrics = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount),0) AS totalRevenue,
        COUNT(*) AS totalTransactions,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END),0) AS todayRevenue,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) AS todayTransactions
      FROM transactions
    `).get();

    const inv = db.prepare(`
      SELECT 
        COUNT(*) AS totalProducts,
        COALESCE(SUM(quantity),0) AS totalStock
      FROM batches
    `).get();

    const lowStock = db.prepare(`
      SELECT COUNT(*) AS lowStock
      FROM products p
      JOIN batches b ON b.product_id = p.id
      WHERE b.quantity <= COALESCE(p.reorder_threshold, 10)
    `).get();

    return {
      success: true,
      data: {
        totalRevenue: metrics.totalRevenue,
        totalTransactions: metrics.totalTransactions,
        todayRevenue: metrics.todayRevenue,
        todayTransactions: metrics.todayTransactions,
        totalProducts: inv.totalProducts,
        totalStock: inv.totalStock,
        lowStock: lowStock.lowStock,
      },
    };
  } catch (error) {
    console.error("Failed to get dashboard metrics:", error);
    return { success: false, message: error.message };
  }
});

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
