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

export interface SpoilageRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNo: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  expiryDate: string;
  spoiledAt: string;
  reason?: string;
}

export interface ExpenseRecord {
  id: string;
  type: 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  referenceId?: string;
  notes?: string;
}

export interface RestockRecord {
  id: string;
  productId: string;
  productName: string;
  originalSku: string;
  restockSku: string;
  quantity: number;
  batchNo: string;
  expiryDate: string;
  barcode: string;
  createdAt: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private dbName = 'lw-minimart';
  private dbVersion = 3;
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

        if (!db.objectStoreNames.contains('spoilage')) {
          const spoilageStore = db.createObjectStore('spoilage', { keyPath: 'id' });
          spoilageStore.createIndex('productId', 'productId', { unique: false });
          spoilageStore.createIndex('spoiledAt', 'spoiledAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('expenses')) {
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expensesStore.createIndex('type', 'type', { unique: false });
          expensesStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('restock')) {
          const restockStore = db.createObjectStore('restock', { keyPath: 'id' });
          restockStore.createIndex('productId', 'productId', { unique: false });
          restockStore.createIndex('createdAt', 'createdAt', { unique: false });
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

  public async moveProductToSpoilage(product: Product, reason: string = 'Expired'): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const quantity = product.stock;

      const transaction = db.transaction(['products', 'spoilage', 'expenses'], 'readwrite');
      const productsStore = transaction.objectStore('products');
      const spoilageStore = transaction.objectStore('spoilage');
      const expensesStore = transaction.objectStore('expenses');

      const costPerUnit = product.cost ?? 0;
      const totalCost = costPerUnit * quantity;
      const nowIso = new Date().toISOString();

      const spoilageRecord: SpoilageRecord = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        batchNo: product.batchNo,
        quantity,
        costPerUnit,
        totalCost,
        expiryDate: product.expiryDate,
        spoiledAt: nowIso,
        reason,
      };

      const expenseRecord: ExpenseRecord = {
        id: uuidv4(),
        type: 'EXPENSE',
        category: 'Spoilage',
        amount: totalCost,
        date: nowIso,
        referenceId: spoilageRecord.id,
        notes: `Spoilage for ${product.name} (${product.batchNo})`,
      };

      const updatedProduct: Product = {
        ...product,
        stock: 0,
        status: 'Spoiled',
        updatedAt: nowIso,
      };

      spoilageStore.add(spoilageRecord);
      expensesStore.add(expenseRecord);
      productsStore.put(updatedProduct);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject('Failed to move product to spoilage');
      transaction.onabort = () => reject('Failed to move product to spoilage');
    });
  }

  public async getSpoilageHistory(): Promise<SpoilageRecord[]> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['spoilage'], 'readonly');
      const store = transaction.objectStore('spoilage');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as SpoilageRecord[]) || []);
      };

      request.onerror = () => reject('Failed to fetch spoilage history');
    });
  }

  public async addRestockRecord(record: Omit<RestockRecord, 'id' | 'createdAt'>): Promise<void> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['restock'], 'readwrite');
      const store = transaction.objectStore('restock');

      const nowIso = new Date().toISOString();
      const newRecord: RestockRecord = {
        ...record,
        id: uuidv4(),
        createdAt: nowIso,
      };

      const request = store.add(newRecord);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to add restock record');
    });
  }

  public async getRestockHistory(): Promise<RestockRecord[]> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['restock'], 'readonly');
      const store = transaction.objectStore('restock');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as RestockRecord[]) || []);
      };

      request.onerror = () => reject('Failed to fetch restock history');
    });
  }
}

export const dbService = DatabaseService.getInstance();
