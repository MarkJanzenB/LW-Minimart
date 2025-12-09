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
    SELECT p.*, SUM(b.quantity) as stock_quantity
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    GROUP BY p.id
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
    SELECT p.*, SUM(b.quantity) as stock_quantity
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.barcode = ?
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
    },
    recentTransactions: recentTransactions || [],
  };
}
