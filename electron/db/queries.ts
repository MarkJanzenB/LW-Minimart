import { db } from './db';
import { Transaction } from '../../src/integrations/supabase/types';

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
    'INSERT INTO sales (total_amount, payment_method, cash_received, change) VALUES (@total, @paymentMethod, @cashReceived, @change)'
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
  const stmt = db.prepare('SELECT * FROM products');
  return stmt.all();
}
