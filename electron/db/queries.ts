import { db } from './db';

export function getProducts() {
  const stmt = db.prepare('SELECT * FROM products');
  return stmt.all();
}
