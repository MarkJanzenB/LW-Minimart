import { Product } from './types';

export const TAX_RATE = 0.12;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Coca-Cola 330ml',
    code: 'BEV001',
    price: 1.50,
    stock: 47,
    category: 'Beverage',
    color: 'bg-red-100'
  },
  {
    id: '2',
    name: "Lay's Classic Chips",
    code: 'SNK001',
    price: 2.99,
    stock: 2,
    category: 'Snack',
    color: 'bg-yellow-100'
  },
  {
    id: '3',
    name: 'Fresh Milk 1L',
    code: 'DAI001',
    price: 3.50,
    stock: 15,
    category: 'Dairy',
    color: 'bg-blue-50'
  },
  {
    id: '4',
    name: 'Canned Tuna',
    code: 'CAN001',
    price: 2.25,
    stock: 60,
    category: 'Canned',
    color: 'bg-gray-100'
  },
  {
    id: '5',
    name: 'Shampoo 250ml',
    code: 'PER001',
    price: 5.99,
    stock: 8,
    category: 'Personal Care',
    color: 'bg-pink-100'
  },
  {
    id: '6',
    name: 'Dish Soap',
    code: 'HOU001',
    price: 3.25,
    stock: 22,
    category: 'Household',
    color: 'bg-green-100'
  },
  {
    id: '7',
    name: 'Energy Drink',
    code: 'BEV002',
    price: 2.99,
    stock: 3,
    category: 'Beverage',
    color: 'bg-purple-100'
  },
  {
    id: '8',
    name: 'Chocolate Bar',
    code: 'SNK002',
    price: 1.75,
    stock: 46,
    category: 'Snack',
    color: 'bg-orange-100'
  },
  {
    id: '9',
    name: 'Bread Loaf',
    code: 'BAK001',
    price: 1.20,
    stock: 12,
    category: 'Bakery',
    color: 'bg-amber-100'
  },
  {
    id: '10',
    name: 'Toilet Paper',
    code: 'HOU002',
    price: 4.50,
    stock: 6,
    category: 'Household',
    color: 'bg-slate-100'
  },
  {
    id: '11',
    name: 'Instant Noodles',
    code: 'FOO001',
    price: 0.90,
    stock: 30,
    category: 'Food',
    color: 'bg-yellow-50'
  },
  {
    id: '12',
    name: 'Bag of Rice',
    code: 'GR001',
    price: 12.00,
    stock: 4,
    category: 'Grains',
    color: 'bg-stone-100'
  }
];
