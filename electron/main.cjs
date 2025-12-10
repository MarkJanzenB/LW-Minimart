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
    status TEXT DEFAULT 'Completed' CHECK(status IN ('Completed', 'Refunded', 'Cancelled')),
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

// Migrations for existing databases
try {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  if (!message.includes("duplicate column name")) {
    console.error("Failed to add image_url column to products table:", e);
  }
}

// Add status column to transactions table if it doesn't exist
try {
  db.exec("ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'Completed'");
  // Update existing rows that might have NULL status (though DEFAULT should handle this)
  db.exec("UPDATE transactions SET status = 'Completed' WHERE status IS NULL OR status = ''");
  console.log("✓ Added status column to transactions table");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  if (!message.includes("duplicate column name")) {
    console.error("Failed to add status column to transactions table:", e);
  }
}

// Ensure spoilage and expenses tables exist (migration for existing databases)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS spoilage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT,
      batch_code TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      cost_per_unit NUMERIC DEFAULT 0.00,
      total_cost NUMERIC DEFAULT 0.00,
      expiry_date TEXT,
      spoiled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reason TEXT DEFAULT 'Expired',
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('EXPENSE', 'INCOME')),
      category TEXT NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0.00,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_spoilage_product ON spoilage(product_id);
    CREATE INDEX IF NOT EXISTS idx_spoilage_spoiled_at ON spoilage(spoiled_at);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
  `);
  console.log("✓ Spoilage and expenses tables verified/created");
} catch (e) {
  console.error("Failed to create spoilage/expenses tables:", e);
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
        p.id,
        p.sku,
        p.barcode,
        p.name,
        p.description,
        p.category_id,
        p.supplier_id,
        p.unit_id,
        p.purchase_price,
        p.selling_price as price,
        p.reorder_threshold,
        p.image_url,
        p.is_active,
        p.created_at,
        COALESCE(SUM(b.quantity), 0) as stock_quantity,
        COALESCE(SUM(b.quantity), 0) as stock,
        COALESCE(c.name, 'Uncategorized') as category
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
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
        p.id,
        p.sku,
        p.barcode,
        p.name,
        p.description,
        p.category_id,
        p.supplier_id,
        p.unit_id,
        p.purchase_price,
        p.selling_price as price,
        p.reorder_threshold,
        p.image_url,
        p.is_active,
        p.created_at,
        COALESCE(SUM(b.quantity), 0) as stock_quantity,
        COALESCE(SUM(b.quantity), 0) as stock,
        COALESCE(c.name, 'Uncategorized') as category
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.is_active = 1
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

ipcMain.handle("products:getInventory", () => {
  try {
    const stmt = db.prepare(`
      SELECT 
        p.id,
        p.sku,
        p.barcode,
        p.name,
        p.selling_price as price,
        p.reorder_threshold as minStock,
        p.image_url,
        COALESCE(c.name, 'Uncategorized') as category,
        COALESCE(SUM(b.quantity), 0) as stock,
        MAX(b.expiry_date) as expiryDate,
        MAX(b.batch_code) as batchNo,
        CASE 
          WHEN MAX(b.expiry_date) < date('now') AND MAX(b.expiry_date) IS NOT NULL THEN 'Expired'
          WHEN COALESCE(SUM(b.quantity), 0) <= p.reorder_threshold THEN 'Low Stock'
          WHEN COALESCE(SUM(b.quantity), 0) = 0 THEN 'Out of Stock'
          ELSE 'In Stock'
        END as status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN batches b ON p.id = b.product_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.name
    `);
    return { success: true, data: stmt.all() };
  } catch (error) {
    console.error("Failed to get inventory items:", error);
    return { success: false, message: error.message };
  }
});

// Helper function to get or create category
function getOrCreateCategory(categoryName) {
  const getCategory = db.prepare("SELECT id FROM categories WHERE name = ?");
  const existing = getCategory.get(categoryName);
  
  if (existing) {
    return existing.id;
  }
  
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const result = insertCategory.run(categoryName);
  return result.lastInsertRowid;
}

// Create product handler
ipcMain.handle("products:create", (_event, productData) => {
  try {
    console.log("Creating product in SQLite:", productData);
    let categoryId = null;
    if (productData.category) {
      categoryId = getOrCreateCategory(productData.category);
      console.log("Category ID:", categoryId);
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (
        sku, barcode, name, description, category_id, supplier_id, unit_id,
        purchase_price, selling_price, reorder_threshold, image_url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const purchasePrice = productData.cost ?? productData.purchase_price ?? 0;
    const sellingPrice = productData.price ?? productData.selling_price ?? 0;
    const reorderThreshold = productData.minStock ?? productData.reorder_threshold ?? 0;
    const imageUrl = productData.imageUrl || productData.image_url || null;
    
    console.log("Inserting product with:", {
      name: productData.name,
      purchasePrice,
      sellingPrice,
      reorderThreshold,
      categoryId,
      hasImage: !!imageUrl
    });
    
    const productResult = insertProduct.run(
      productData.sku || null,
      productData.barcode || null,
      productData.name,
      productData.description || null,
      categoryId,
      productData.supplier_id || null,
      productData.unit_id || null,
      purchasePrice,
      sellingPrice,
      reorderThreshold,
      imageUrl
    );
    
    const productId = productResult.lastInsertRowid;
    console.log("Product created with ID:", productId);

    // Insert batch if quantity is provided (even if 0, we should still create a batch if stock is provided)
    const stockQuantity = productData.stock ?? productData.quantity ?? 0;
    if (stockQuantity > 0) {
      const insertBatch = db.prepare(`
        INSERT INTO batches (
          product_id, batch_code, quantity, expiry_date, cost_per_unit, received_date
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      
      const batchCode = productData.batchNo || productData.batch_code || null;
      const expiryDate = productData.expiryDate || productData.expiry_date || null;
      const costPerUnit = productData.cost ?? productData.purchase_price ?? purchasePrice;
      
      console.log("Inserting batch:", {
        productId,
        batchCode,
        quantity: stockQuantity,
        expiryDate,
        costPerUnit
      });
      
      insertBatch.run(
        productId,
        batchCode,
        stockQuantity,
        expiryDate,
        costPerUnit
      );
      console.log("Batch created successfully");
    } else {
      console.log("No batch created - stock quantity is 0 or not provided");
    }

    console.log("Product creation completed successfully");
    return { success: true, data: { id: productId } };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, message: error.message };
  }
});

// Update product handler
ipcMain.handle("products:update", (_event, productId, productData) => {
  try {
    console.log("Updating product in SQLite:", productId, productData);
    let categoryId = null;
    if (productData.category) {
      categoryId = getOrCreateCategory(productData.category);
    }

    const updates = [];
    const values = [];

    if (productData.name !== undefined) {
      updates.push("name = ?");
      values.push(productData.name);
    }
    if (productData.sku !== undefined) {
      updates.push("sku = ?");
      values.push(productData.sku);
    }
    if (productData.barcode !== undefined) {
      updates.push("barcode = ?");
      values.push(productData.barcode);
    }
    if (productData.description !== undefined) {
      updates.push("description = ?");
      values.push(productData.description);
    }
    if (categoryId !== null) {
      updates.push("category_id = ?");
      values.push(categoryId);
    }
    if (productData.supplier_id !== undefined) {
      updates.push("supplier_id = ?");
      values.push(productData.supplier_id);
    }
    if (productData.unit_id !== undefined) {
      updates.push("unit_id = ?");
      values.push(productData.unit_id);
    }
    if (productData.cost !== undefined || productData.purchase_price !== undefined) {
      updates.push("purchase_price = ?");
      values.push(productData.cost ?? productData.purchase_price ?? 0);
    }
    if (productData.price !== undefined || productData.selling_price !== undefined) {
      updates.push("selling_price = ?");
      values.push(productData.price ?? productData.selling_price ?? 0);
    }
    if (productData.minStock !== undefined || productData.reorder_threshold !== undefined) {
      updates.push("reorder_threshold = ?");
      values.push(productData.minStock ?? productData.reorder_threshold ?? 0);
    }
    if (productData.imageUrl !== undefined || productData.image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(productData.imageUrl ?? productData.image_url ?? null);
    }
    if (productData.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(productData.is_active);
    }

    if (updates.length === 0) {
      return { success: true, data: { id: productId } };
    }

    values.push(productId);
    const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...values);

    console.log("Product updated successfully");
    return { success: true, data: { id: productId } };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, message: error.message };
  }
});

// Add batch to product handler
ipcMain.handle("products:addBatch", (_event, productId, batchData) => {
  try {
    const insertBatch = db.prepare(`
      INSERT INTO batches (
        product_id, batch_code, quantity, expiry_date, cost_per_unit, received_date
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    
    const result = insertBatch.run(
      productId,
      batchData.batchNo || batchData.batch_code || null,
      batchData.stock ?? batchData.quantity ?? 0,
      batchData.expiryDate || batchData.expiry_date || null,
      batchData.cost ?? batchData.cost_per_unit ?? 0
    );
    
    return { success: true, data: { id: result.lastInsertRowid } };
  } catch (error) {
    console.error("Failed to add batch:", error);
    return { success: false, message: error.message };
  }
});

// Delete product handler
ipcMain.handle("products:delete", (_event, productId) => {
  try {
    // Soft delete by setting is_active to 0
    const updateProduct = db.prepare("UPDATE products SET is_active = 0 WHERE id = ?");
    updateProduct.run(productId);
    
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, message: error.message };
  }
});

// ---- Transactions IPC ----
ipcMain.handle("transactions:getAll", (_event, limit, offset) => {
  try {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';
    
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.transaction_id,
        t.total_amount as total,
        t.subtotal,
        t.tax_amount as tax,
        t.payment_method,
        t.status,
        t.created_at as date,
        ti.product_id,
        ti.quantity,
        ti.unit_price,
        ti.subtotal as item_subtotal,
        p.name as product_name,
        p.barcode as product_barcode
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      ORDER BY t.created_at DESC
      ${limitClause} ${offsetClause}
    `);
    
    const rows = stmt.all();
    
    // Group items by transaction
    const transactionsMap = new Map();
    for (const row of rows) {
      if (!transactionsMap.has(row.id)) {
        transactionsMap.set(row.id, {
          id: row.transaction_id || row.id.toString(),
          transaction_id: row.transaction_id,
          total: row.total,
          subtotal: row.subtotal,
          tax: row.tax,
          payment_method: row.payment_method,
          status: row.status,
          date: row.date,
          items: []
        });
      }
      
      if (row.product_id) {
        transactionsMap.get(row.id).items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          product_barcode: row.product_barcode,
          quantity: row.quantity,
          unit_price: row.unit_price,
          subtotal: row.item_subtotal
        });
      }
    }
    
    return { success: true, data: Array.from(transactionsMap.values()) };
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("transactions:getById", (_event, transactionId) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        t.id,
        t.transaction_id,
        t.total_amount as total,
        t.subtotal,
        t.tax_amount as tax,
        t.payment_method,
        t.status,
        t.created_at as date,
        ti.product_id,
        ti.quantity,
        ti.unit_price,
        ti.subtotal as item_subtotal,
        p.name as product_name,
        p.barcode as product_barcode
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE t.transaction_id = ?
    `);
    
    const rows = stmt.all(transactionId);
    if (rows.length === 0) {
      return { success: true, data: null };
    }
    
    const transaction = {
      id: rows[0].transaction_id || rows[0].id.toString(),
      transaction_id: rows[0].transaction_id,
      total: rows[0].total,
      subtotal: rows[0].subtotal,
      tax: rows[0].tax,
      payment_method: rows[0].payment_method,
      status: rows[0].status,
      date: rows[0].date,
      items: rows
        .filter(row => row.product_id)
        .map(row => ({
          product_id: row.product_id,
          product_name: row.product_name,
          product_barcode: row.product_barcode,
          quantity: row.quantity,
          unit_price: row.unit_price,
          subtotal: row.item_subtotal
        }))
    };
    
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Failed to get transaction:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("transactions:create", (_event, transactionData) => {
  try {
    const result = db.transaction(() => {
      // Insert transaction
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (transaction_id, subtotal, tax_amount, total_amount, payment_method, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Completed')
      `);
      const transactionResult = insertTransaction.run(
        transactionData.transaction_id,
        transactionData.subtotal,
        transactionData.tax_amount,
        transactionData.total_amount,
        transactionData.payment_method,
        transactionData.created_by || null
      );
      const transactionDbId = transactionResult.lastInsertRowid;

      // Insert transaction items
      const insertItem = db.prepare(`
        INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      // Update batch quantities (reduce stock) - FIFO (First In First Out)
      const getBatches = db.prepare(`
        SELECT id, quantity 
        FROM batches 
        WHERE product_id = ? AND quantity > 0 
        ORDER BY expiry_date ASC, created_at ASC
      `);
      const updateBatch = db.prepare(`
        UPDATE batches 
        SET quantity = quantity - ? 
        WHERE id = ?
      `);

      for (const item of transactionData.items || []) {
        insertItem.run(transactionDbId, item.product_id, item.quantity, item.unit_price, item.subtotal);
        
        // Reduce stock from batches using FIFO
        let quantityToDeduct = item.quantity;
        const batches = getBatches.all(item.product_id);
        
        for (const batch of batches) {
          if (quantityToDeduct <= 0) break;
          const deductAmount = Math.min(quantityToDeduct, batch.quantity);
          updateBatch.run(deductAmount, batch.id);
          quantityToDeduct -= deductAmount;
        }
        
        if (quantityToDeduct > 0) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}`);
        }
      }

      return { id: transactionDbId, transaction_id: transactionData.transaction_id };
    })();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, message: error.message };
  }
});

// Dashboard metrics
ipcMain.handle("dashboard:getMetrics", () => {
  try {
    // Get total revenue from transactions
    const revenueStmt = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COUNT(*) as totalTransactions,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as todayRevenue,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as todayTransactions
      FROM transactions
      WHERE status = 'Completed'
    `);
    const revenue = revenueStmt.get();

    // Get total products and stock
    const inventoryStmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as totalProducts,
        COALESCE(SUM(b.quantity), 0) as totalStock
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      WHERE p.is_active = 1
    `);
    const inventory = inventoryStmt.get();

    // Get low stock count
    const lowStockStmt = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as lowStockCount
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      WHERE p.is_active = 1
      GROUP BY p.id
      HAVING COALESCE(SUM(b.quantity), 0) <= p.reorder_threshold
    `);
    const lowStockResult = lowStockStmt.all();
    const lowStockCount = lowStockResult.length;

    // Get products nearing expiry (next 7 days)
    const expiringSoonStmt = db.prepare(`
      SELECT COUNT(DISTINCT p.id) as expiringSoonCount
      FROM products p
      LEFT JOIN batches b ON p.id = b.product_id
      WHERE p.is_active = 1
        AND b.expiry_date IS NOT NULL
        AND b.expiry_date > date('now')
        AND b.expiry_date <= date('now', '+7 days')
        AND COALESCE(b.quantity, 0) > 0
    `);
    const expiringSoonRow = expiringSoonStmt.get();
    const expiringSoonCount = expiringSoonRow?.expiringSoonCount || 0;

    // Get recent transactions for chart data
    const recentTransactionsStmt = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as count
      FROM transactions
      WHERE status = 'Completed'
        AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const recentTransactions = recentTransactionsStmt.all();

    // Get top products by sales
    const topProductsStmt = db.prepare(`
      SELECT 
        p.id,
        p.name,
        SUM(ti.quantity) as quantity_sold,
        SUM(ti.subtotal) as total_sales
      FROM products p
      INNER JOIN transaction_items ti ON p.id = ti.product_id
      INNER JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.status = 'Completed'
      GROUP BY p.id, p.name
      ORDER BY total_sales DESC
      LIMIT 10
    `);
    const topProducts = topProductsStmt.all();

    // Get inventory by category breakdown
    const categoryBreakdownStmt = db.prepare(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(b.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN batches b ON p.id = b.product_id
      WHERE p.is_active = 1
      GROUP BY c.name
      ORDER BY total_stock DESC
    `);
    const categoryBreakdown = categoryBreakdownStmt.all();

    // Calculate category percentages for pie chart
    const totalStockForPercentage = categoryBreakdown.reduce((sum, cat) => sum + (cat.total_stock || 0), 0);
    const inventoryByCategory = categoryBreakdown.map(cat => ({
      category: cat.category,
      value: totalStockForPercentage > 0 
        ? Math.round((cat.total_stock / totalStockForPercentage) * 100) 
        : 0,
      productCount: cat.product_count,
      totalStock: cat.total_stock
    }));

    return {
      success: true,
      data: {
        revenue: {
          total: revenue?.totalRevenue || 0,
          today: revenue?.todayRevenue || 0,
          transactions: revenue?.totalTransactions || 0,
          todayTransactions: revenue?.todayTransactions || 0,
        },
        inventory: {
          totalProducts: inventory?.totalProducts || 0,
          totalStock: inventory?.totalStock || 0,
          lowStockCount: lowStockCount || 0,
          expiringSoonCount,
        },
        recentTransactions: recentTransactions || [],
        topProducts: topProducts || [],
        inventoryByCategory: inventoryByCategory || [],
      }
    };
  } catch (error) {
    console.error("Failed to get dashboard metrics:", error);
    return { success: false, message: error.message };
  }
});

// ---- Spoilage IPC ----
ipcMain.handle("spoilage:moveToSpoilage", (_event, productId, quantity, reason = 'Expired') => {
  try {
    const result = db.transaction(() => {
      // Get product details
      const getProduct = db.prepare(`
        SELECT p.*, b.batch_code, b.expiry_date, b.cost_per_unit 
        FROM products p 
        LEFT JOIN batches b ON p.id = b.product_id 
        WHERE p.id = ? 
        LIMIT 1
      `);
      const product = getProduct.get(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const costPerUnit = product.cost_per_unit || product.purchase_price || 0;
      const totalCost = costPerUnit * quantity;
      const now = new Date().toISOString();

      // Insert spoilage record
      const insertSpoilage = db.prepare(`
        INSERT INTO spoilage (
          product_id, product_name, sku, batch_code, quantity, 
          cost_per_unit, total_cost, expiry_date, spoiled_at, reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const spoilageResult = insertSpoilage.run(
        productId,
        product.name,
        product.sku || null,
        product.batch_code || null,
        quantity,
        costPerUnit,
        totalCost,
        product.expiry_date || null,
        now,
        reason
      );

      // Insert expense record
      const insertExpense = db.prepare(`
        INSERT INTO expenses (type, category, amount, date, reference_id, notes)
        VALUES ('EXPENSE', 'Spoilage', ?, ?, ?, ?)
      `);
      
      insertExpense.run(
        totalCost,
        now,
        spoilageResult.lastInsertRowid.toString(),
        `Spoilage for ${product.name}${product.batch_code ? ` (${product.batch_code})` : ''}`
      );

      // Update batch quantity (reduce stock) - FIFO approach
      const getBatches = db.prepare(`
        SELECT id, quantity, batch_code
        FROM batches 
        WHERE product_id = ? AND quantity > 0
        ORDER BY expiry_date ASC, created_at ASC
      `);
      const updateBatch = db.prepare(`
        UPDATE batches 
        SET quantity = quantity - ? 
        WHERE id = ?
      `);
      const deleteEmptyBatch = db.prepare(`
        DELETE FROM batches 
        WHERE id = ? AND quantity <= 0
      `);

      let remainingQty = quantity;
      const batches = getBatches.all(productId);
      
      for (const batch of batches) {
        if (remainingQty <= 0) break;
        const deduct = Math.min(remainingQty, batch.quantity);
        updateBatch.run(deduct, batch.id);
        deleteEmptyBatch.run(batch.id);
        remainingQty -= deduct;
      }

      return { id: spoilageResult.lastInsertRowid };
    })();
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to move product to spoilage:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("spoilage:getAll", (_event, limit, offset) => {
  try {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';
    
    const sql = `
      SELECT 
        s.id,
        s.product_id as productId,
        s.product_name as productName,
        s.sku,
        s.batch_code as batchNo,
        s.quantity,
        s.cost_per_unit as costPerUnit,
        s.total_cost as totalCost,
        s.expiry_date as expiryDate,
        s.spoiled_at as spoiledAt,
        s.reason
      FROM spoilage s
      ORDER BY s.spoiled_at DESC
      ${limitClause} ${offsetClause}
    `;
    
    const rows = db.prepare(sql).all();
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to get spoilage history:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("spoilage:getStats", () => {
  try {
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM spoilage').get();
    const totalQuantity = db.prepare('SELECT SUM(quantity) as total FROM spoilage').get();
    const totalCost = db.prepare('SELECT SUM(total_cost) as total FROM spoilage').get();
    
    return {
      success: true,
      data: {
        totalRecords: totalRecords?.count || 0,
        totalQuantity: totalQuantity?.total || 0,
        totalCost: totalCost?.total || 0,
      }
    };
  } catch (error) {
    console.error("Failed to get spoilage stats:", error);
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
