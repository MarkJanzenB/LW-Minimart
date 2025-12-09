import type { CashflowPoint, OverviewMetrics, Transaction } from "@/types/finance";

// All data now comes from database - no mock data
// These functions are kept for type compatibility but should fetch from database
export const getMockOverviewMetrics = async (): Promise<OverviewMetrics> => {
  // Fetch from database via IPC
  const response = await (window as any).api.dashboard.getMetrics();
  if (response.success && response.data) {
    return {
      totalRevenue: response.data.revenue?.total || 0,
      totalExpenses: 0, // Expenses tracking to be implemented
      netProfit: response.data.revenue?.total || 0,
      activeCustomers: 0, // Customer tracking to be implemented
      totalOrders: response.data.revenue?.transactions || 0,
    };
  }
  return {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeCustomers: 0,
    totalOrders: 0,
  };
};

export const getMockCashflow = async (): Promise<CashflowPoint[]> => {
  // Fetch from database via IPC
  const response = await (window as any).api.dashboard.getMetrics();
  if (response.success && response.data?.recentTransactions) {
    return response.data.recentTransactions.map((t: any) => ({
      month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
      income: t.revenue || 0,
      expenses: 0, // Expenses tracking to be implemented
      net: t.revenue || 0,
    }));
  }
  return [];
};

export const getMockTransactions = async (): Promise<Transaction[]> => {
  // Fetch from database via IPC
  const response = await (window as any).api.transactions.getAll();
  if (response.success && response.data) {
    return response.data.map((t: any) => ({
      id: t.transaction_id || t.id.toString(),
      date: new Date(t.date || t.created_at).toISOString().split('T')[0],
      description: `Transaction ${t.transaction_id || t.id}`,
      category: "Sales",
      type: "income",
      amount: parseFloat(t.total_amount) || 0,
      account: "Store",
    }));
  }
  return [];
};
