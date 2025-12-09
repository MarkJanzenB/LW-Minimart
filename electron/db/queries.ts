import { db } from './db';

// Products queries
export function getProducts() {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.sku,
      p.barcode,
      p.name,
      p.description,
      p.selling_price as price,
      p.purchase_price,
      p.reorder_threshold as minStock,
      p.is_active,
      c.name as category,
      COALESCE(SUM(b.quantity), 0) as stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY p.name
  `);
  return stmt.all();
}

export function getProductByBarcode(barcode: string) {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.sku,
      p.barcode,
      p.name,
      p.description,
      p.selling_price as price,
      p.purchase_price,
      p.reorder_threshold as minStock,
      p.is_active,
      c.name as category,
      COALESCE(SUM(b.quantity), 0) as stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.barcode = ? AND p.is_active = 1
    GROUP BY p.id
  `);
  return stmt.get(barcode);
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

    // Update batch quantities (reduce stock)
    const updateBatch = db.prepare(`
      UPDATE batches 
      SET quantity = quantity - ?
      WHERE product_id = ? AND quantity >= ?
      ORDER BY expiry_date ASC, created_at ASC
      LIMIT 1
    `);

    for (const item of transactionData.items) {
      insertItem.run(transactionDbId, item.product_id, item.quantity, item.unit_price, item.subtotal);
      // Reduce stock from batches
      updateBatch.run(item.quantity, item.product_id, item.quantity);
    }

    return { id: transactionDbId, transaction_id: transactionData.transaction_id };
  })();
}
