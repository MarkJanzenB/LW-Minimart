import Database from "better-sqlite3";
import { join } from "path";
import { readFileSync, mkdirSync } from "fs";

const dbDir = __dirname;
mkdirSync(dbDir, { recursive: true });
export const dbPath = join(dbDir, "store.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

try {
  const schemaPath = join(dbDir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  if (schema && schema.trim().length > 0) {
    db.exec(schema);
  }
} catch (e) {
  console.error("Failed to apply database schema:", e);
}

try {
  db.exec("ALTER TABLE sales ADD COLUMN reference_number TEXT");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  if (!message.includes("duplicate column name")) {
    console.error("Failed to update sales table:", e);
  }
}

try {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  if (!message.includes("duplicate column name")) {
    console.error("Failed to update products table:", e);
  }
}