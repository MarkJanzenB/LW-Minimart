import { v4 as uuidv4 } from 'uuid';

export interface Product {
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

class DatabaseService {
  private static instance: DatabaseService;
  private dbName = 'lw-minimart';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initDB();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', (event.target as IDBRequest).error);
        reject('Failed to open database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result;
        
        // Create products store if it doesn't exist
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'id' });
          store.createIndex('sku', 'sku', { unique: true });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  private async getDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Product CRUD operations
  public async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      
      const newProduct: Product = {
        ...product,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const request = store.add(newProduct);
      
      request.onsuccess = () => resolve(newProduct.id);
      request.onerror = () => reject('Failed to add product');
    });
  }

  public async getProducts(): Promise<Product[]> {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to fetch products');
    });
  }

  public async updateProduct(product: Product): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');

      const updatedProduct: Product = {
        ...product,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(updatedProduct);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to update product');
    });
  }

  public async deleteProduct(id: string): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete product');
    });
  }
}

export const dbService = DatabaseService.getInstance();
