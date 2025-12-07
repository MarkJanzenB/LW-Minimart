import { db } from './db';

export function getProducts() {
  const stmt = db.prepare('SELECT * FROM products');
  return stmt.all();
}

// Inventory mirror helpers
export function upsertInventoryProducts(products: any[]) {
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

  const transaction = db.transaction((rows: any[]) => {
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
