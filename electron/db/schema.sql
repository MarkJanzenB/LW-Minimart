PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('owner','cashier'))
);

-- 1. Basic reference tables
CREATE TABLE IF NOT EXISTS categories (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL UNIQUE,
                            description TEXT,
                            created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                           name TEXT NOT NULL,
                           contact_name TEXT,
                           phone TEXT,
                           email TEXT,
                           address TEXT,
                           notes TEXT,
                           created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                       code TEXT NOT NULL UNIQUE,
                       name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS products (
                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                          sku TEXT UNIQUE,
                          barcode TEXT UNIQUE,
                          name TEXT NOT NULL,
                          description TEXT,
                          category_id INTEGER,
                          supplier_id INTEGER,
                          unit_id INTEGER,
                          purchase_price NUMERIC DEFAULT 0.00,
                          selling_price NUMERIC DEFAULT 0.00,
                          reorder_threshold INTEGER DEFAULT 0,
                          is_active INTEGER DEFAULT 1,
                          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
                          FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);


CREATE TABLE IF NOT EXISTS batches (
                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                         product_id INTEGER NOT NULL,
                         batch_code TEXT,
                         quantity INTEGER NOT NULL DEFAULT 0,
                         received_date TEXT,
                         expiry_date TEXT,
                         cost_per_unit NUMERIC DEFAULT 0.00,
                         location TEXT,
                         created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
                                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                                  product_id INTEGER,
                                  threshold INTEGER NOT NULL,
                                  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
                                  is_resolved INTEGER DEFAULT 0,
                                  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Transactions/Sales table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  subtotal NUMERIC NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC NOT NULL DEFAULT 0.00,
  payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'mobile')) DEFAULT 'cash',
  status TEXT CHECK(status IN ('Completed', 'Refunded', 'Cancelled')) DEFAULT 'Completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Transaction items (line items for each transaction)
CREATE TABLE IF NOT EXISTS transaction_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0.00,
  subtotal NUMERIC NOT NULL DEFAULT 0.00,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);