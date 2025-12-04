export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO string
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  account: string;
}

export interface CashflowPoint {
  month: string; // e.g. "Jan 2025"
  income: number;
  expenses: number;
  net: number;
}

export interface OverviewMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeCustomers: number;
  totalOrders: number;
}
