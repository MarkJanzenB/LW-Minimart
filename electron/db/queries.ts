import { db } from './db';
import { Transaction, CartItem } from '../../src/integrations/supabase/types';

interface InventoryMirrorRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  expiryDate: string;
  status: string;
  batchNo: string;
  barcode: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Products queries
export function getProducts() {
  const sql = `
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
      c.name as category
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY p.name
  `;
  try {
    return db.prepare(sql).all();
  } catch (err) {
    console.error('Error getting products', err);
    throw err;
  }
}

export function getProductByBarcode(barcode: string) {
  const sql = `
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
      c.name as category
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = ? AND p.is_active = 1
    GROUP BY p.id
  `;
  try {
    return db.prepare(sql).get(barcode);
  } catch (err) {
    console.error('Error getting product by barcode', err);
    throw err;
  }
}

export function recordSale(transaction: Transaction) {
  const insertSale = db.prepare(
    'INSERT INTO sales (total_amount, payment_method, cash_received, change, reference_number) VALUES (@total, @paymentMethod, @cashReceived, @change, @referenceNumber)'
  );

  const insertSaleItem = db.prepare(
    'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (@saleId, @productId, @quantity, @price)'
  );

  const getBatches = db.prepare(
    'SELECT id, quantity FROM batches WHERE product_id = ? AND quantity > 0 ORDER BY expiry_date ASC'
  );

  const updateBatch = db.prepare('UPDATE batches SET quantity = quantity - ? WHERE id = ?');

  const transactionFn = db.transaction((t: Transaction) => {
    const saleResult = insertSale.run({
      total: t.total,
      paymentMethod: t.paymentMethod,
      cashReceived: t.cashReceived,
      change: t.change,
      referenceNumber: t.referenceNumber ?? null,
    });

    const saleId = saleResult.lastInsertRowid;

    for (const item of t.items) {
      insertSaleItem.run({
        saleId,
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      });

      let quantityToDeduct = item.quantity;
      const batches = getBatches.all(item.id) as { id: number; quantity: number }[];

      const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < quantityToDeduct) {
        throw new Error(`Not enough stock for product ${item.name}`);
      }

      for (const batch of batches) {
        if (quantityToDeduct <= 0) break;
        const deductFromThisBatch = Math.min(quantityToDeduct, batch.quantity);
        updateBatch.run(deductFromThisBatch, batch.id);
        quantityToDeduct -= deductFromThisBatch;
      }
    }
    return saleId;
  });

  try {
    return transactionFn(transaction);
  } catch (err) {
    console.error('Error recording sale', err);
    throw err;
  }
}

type SaleRow = {
  id: number;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  cash_received: number | null;
  change: number | null;
  reference_number: string | null;
};

type SaleItemRow = {
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string;
};

export function getSalesWithItems(): Transaction[] {
  const sales = db
    .prepare(
      'SELECT id, transaction_date, total_amount, payment_method, cash_received, change, reference_number FROM sales ORDER BY transaction_date DESC, id DESC'
    )
    .all() as SaleRow[];

  if (!sales.length) {
    return [];
  }

  const saleItems = db
    .prepare(
      `SELECT si.sale_id, si.product_id, si.quantity, si.price,
              p.name, p.sku, p.barcode,
              COALESCE(c.name, '') as category
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id`
    )
    .all() as SaleItemRow[];

  const itemsBySaleId = new Map<number, SaleItemRow[]>();

  for (const item of saleItems) {
    const existing = itemsBySaleId.get(item.sale_id);
    if (existing) {
      existing.push(item);
    } else {
      itemsBySaleId.set(item.sale_id, [item]);
    }
  }

  return sales.map((sale) => {
    const rows = itemsBySaleId.get(sale.id) ?? [];

    const items: CartItem[] = rows.map((row) => ({
      id: String(row.product_id),
      name: row.name,
      code: row.sku ?? '',
      price: row.price,
      stock: 0,
      category: row.category,
      quantity: row.quantity,
      barcode: row.barcode ?? undefined,
    }));

    const subtotal = rows.reduce(
      (sum, row) => sum + row.price * row.quantity,
      0
    );
    const tax = sale.total_amount - subtotal;

    return {
      id: String(sale.id),
      date: new Date(sale.transaction_date),
      items,
      subtotal,
      tax: tax >= 0 ? tax : 0,
      total: sale.total_amount,
      cashReceived: sale.cash_received ?? undefined,
      change: sale.change ?? undefined,
      paymentMethod: sale.payment_method === 'cash' ? 'cash' : 'qr',
      referenceNumber: sale.reference_number ?? undefined,
      status: 'Completed',
    };
  });
}

// Inventory mirror helpers
export function upsertInventoryProducts(products: InventoryMirrorRow[]) {
  const deleteAll = db.prepare('DELETE FROM inventory_mirror');
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

  const transaction = db.transaction((rows: InventoryMirrorRow[]) => {
    deleteAll.run();
    for (const row of rows) {
      insert.run(row);
    }
  });

  transaction(products ?? []);
}

export function getInventoryMirror() {
  const stmt = db.prepare('SELECT * FROM inventory_mirror ORDER BY name');
  return stmt.all();
}

export function deleteInventoryProduct(id: string) {
  const stmt = db.prepare('DELETE FROM inventory_mirror WHERE id = ?');
  stmt.run(id);
}

// Inventory queries (products with batch details)
export function getInventoryItems() {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.sku,
      p.barcode,
      p.name,
      p.selling_price as price,
      p.reorder_threshold as minStock,
      p.image_url,
      c.name as category,
      COALESCE(SUM(b.quantity), 0) as stock,
      MAX(b.expiry_date) as expiryDate,
      MAX(b.batch_code) as batchNo,
      CASE 
        WHEN MAX(b.expiry_date) < date('now') THEN 'Expired'
        WHEN COALESCE(SUM(b.quantity), 0) <= p.reorder_threshold THEN 'Low Stock'
        ELSE 'In Stock'
      END as status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY p.name
  `);
  return stmt.all();
}

// Transactions queries
export function getTransactions(limit?: number, offset?: number) {
  const limitClause = limit ? `LIMIT ${limit}` : '';
  const offsetClause = offset ? `OFFSET ${offset}` : '';
  
  // Get all transactions with their items in one query using subquery
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
      (
        SELECT json_group_array(
          json_object(
            'id', ti.id,
            'product_id', ti.product_id,
            'quantity', ti.quantity,
            'unit_price', ti.unit_price,
            'subtotal', ti.subtotal,
            'product_name', p.name,
            'product_barcode', p.barcode
          )
        )
        FROM transaction_items ti
        LEFT JOIN products p ON ti.product_id = p.id
        WHERE ti.transaction_id = t.id
      ) as items
    FROM transactions t
    ORDER BY t.created_at DESC
    ${limitClause} ${offsetClause}
  `);
  const transactions = stmt.all() as any[];
  
  // Parse JSON items for each transaction
  return transactions.map(t => {
    let items: any[] = [];
    if (t.items) {
      try {
        items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
      } catch (e) {
        console.error('Failed to parse transaction items:', e);
      }
    }
    return {
      ...t,
      items
    };
  });
}

export function getTransactionById(transactionId: string) {
  const stmt = db.prepare(`
    SELECT 
      t.*,
      json_group_array(
        json_object(
          'id', ti.id,
          'product_id', ti.product_id,
          'quantity', ti.quantity,
          'unit_price', ti.unit_price,
          'subtotal', ti.subtotal,
          'product_name', p.name,
          'product_barcode', p.barcode
        )
      ) as items
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.transaction_id = ?
    GROUP BY t.id
  `);
  return stmt.get(transactionId);
}

export function createTransaction(transactionData: {
  transaction_id: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  items: Array<{ product_id: number; quantity: number; unit_price: number; subtotal: number }>;
  created_by?: number;
}) {
  return db.transaction(() => {
    // Insert transaction
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (transaction_id, subtotal, tax_amount, total_amount, payment_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertTransaction.run(
      transactionData.transaction_id,
      transactionData.subtotal,
      transactionData.tax_amount,
      transactionData.total_amount,
      transactionData.payment_method,
      transactionData.created_by || null
    );
    const transactionDbId = result.lastInsertRowid;

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

    for (const item of transactionData.items) {
      insertItem.run(transactionDbId, item.product_id, item.quantity, item.unit_price, item.subtotal);
      
      // Reduce stock from batches using FIFO
      let quantityToDeduct = item.quantity;
      const batches = getBatches.all(item.product_id) as Array<{ id: number; quantity: number }>;
      
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
}

// Dashboard metrics queries
export function getDashboardMetrics() {
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
  const revenue = revenueStmt.get() as any;

  // Get total products and stock
  const inventoryStmt = db.prepare(`
    SELECT 
      COUNT(DISTINCT p.id) as totalProducts,
      COALESCE(SUM(b.quantity), 0) as totalStock
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
  `);
  const inventory = inventoryStmt.get() as any;

  // Get low stock count
  const lowStockStmt = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as lowStockCount
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
    HAVING COALESCE(SUM(b.quantity), 0) <= p.reorder_threshold
  `);
  const lowStockResult = lowStockStmt.all() as any[];
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
  const expiringSoonRow = expiringSoonStmt.get() as any;
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
  const recentTransactions = recentTransactionsStmt.all() as any[];

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
  const topProducts = topProductsStmt.all() as any[];

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
  const categoryBreakdown = categoryBreakdownStmt.all() as any[];

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
  };
}

// Create or update product in SQLite (single source of truth)
export function createProduct(productData: {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_id?: number;
  purchase_price: number;
  selling_price: number;
  reorder_threshold?: number;
  batch_code?: string;
  quantity?: number;
  expiry_date?: string;
  cost_per_unit?: number;
}) {
  return db.transaction(() => {
    // First, get or create category
    let categoryId: number | null = null;
    if (productData.category_id) {
      categoryId = productData.category_id;
    } else {
      // Try to find category by name (if passed as string in future)
      // For now, we'll use the provided category_id or null
    }

    // Insert product
    const insertProduct = db.prepare(`
      INSERT INTO products (
        sku, barcode, name, description, category_id, supplier_id, unit_id,
        purchase_price, selling_price, reorder_threshold, image_url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const productResult = insertProduct.run(
      productData.sku || null,
      productData.barcode || null,
      productData.name,
      productData.description || null,
      categoryId,
      productData.supplier_id || null,
      productData.unit_id || null,
      productData.purchase_price || 0,
      productData.selling_price || 0,
      productData.reorder_threshold || 0,
      productData.image_url || null
    );
    
    const productId = productResult.lastInsertRowid as number;

    // Insert batch if quantity is provided
    if (productData.quantity && productData.quantity > 0) {
      const insertBatch = db.prepare(`
        INSERT INTO batches (
          product_id, batch_code, quantity, expiry_date, cost_per_unit, received_date
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);
      
      insertBatch.run(
        productId,
        productData.batch_code || null,
        productData.quantity,
        productData.expiry_date || null,
        productData.cost_per_unit || productData.purchase_price || 0
      );
    }

    return { id: productId };
  })();
}

// Update product in SQLite
export function updateProduct(productId: number, productData: {
  name?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_id?: number;
  purchase_price?: number;
  selling_price?: number;
  reorder_threshold?: number;
  is_active?: number;
}) {
  const updates: string[] = [];
  const values: any[] = [];

  if (productData.name !== undefined) {
    updates.push('name = ?');
    values.push(productData.name);
  }
  if (productData.sku !== undefined) {
    updates.push('sku = ?');
    values.push(productData.sku);
  }
  if (productData.barcode !== undefined) {
    updates.push('barcode = ?');
    values.push(productData.barcode);
  }
  if (productData.description !== undefined) {
    updates.push('description = ?');
    values.push(productData.description);
  }
  if (productData.category_id !== undefined) {
    updates.push('category_id = ?');
    values.push(productData.category_id);
  }
  if (productData.supplier_id !== undefined) {
    updates.push('supplier_id = ?');
    values.push(productData.supplier_id);
  }
  if (productData.unit_id !== undefined) {
    updates.push('unit_id = ?');
    values.push(productData.unit_id);
  }
  if (productData.purchase_price !== undefined) {
    updates.push('purchase_price = ?');
    values.push(productData.purchase_price);
  }
  if (productData.selling_price !== undefined) {
    updates.push('selling_price = ?');
    values.push(productData.selling_price);
  }
  if (productData.reorder_threshold !== undefined) {
    updates.push('reorder_threshold = ?');
    values.push(productData.reorder_threshold);
  }
  if (productData.image_url !== undefined) {
    updates.push('image_url = ?');
    values.push(productData.image_url);
  }
  if (productData.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(productData.is_active);
  }

  if (updates.length === 0) {
    return { id: productId };
  }

  values.push(productId);
  const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
  
  return { id: productId };
}

// Add batch to existing product
export function addBatchToProduct(productId: number, batchData: {
  batch_code?: string;
  quantity: number;
  expiry_date?: string;
  cost_per_unit?: number;
}) {
  const insertBatch = db.prepare(`
    INSERT INTO batches (
      product_id, batch_code, quantity, expiry_date, cost_per_unit, received_date
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  
  const result = insertBatch.run(
    productId,
    batchData.batch_code || null,
    batchData.quantity,
    batchData.expiry_date || null,
    batchData.cost_per_unit || 0
  );
  
  return { id: result.lastInsertRowid as number };
}

// Get or create category by name
export function getOrCreateCategory(categoryName: string): number {
  const getCategory = db.prepare('SELECT id FROM categories WHERE name = ?');
  const existing = getCategory.get(categoryName) as { id: number } | undefined;
  
  if (existing) {
    return existing.id;
  }
  
  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const result = insertCategory.run(categoryName);
  return result.lastInsertRowid as number;
}

// Delete product (soft delete by setting is_active = 0)
export function deleteProduct(productId: number) {
  const stmt = db.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
  stmt.run(productId);
}
