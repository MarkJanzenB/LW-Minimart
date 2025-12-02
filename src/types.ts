export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  color?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashReceived?: number;
  change?: number;
  paymentMethod: 'cash' | 'card';
}

export type ViewState = 'pos' | 'checkout' | 'receipt';
