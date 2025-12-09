import type { CashflowPoint, OverviewMetrics, Transaction } from "@/types/finance";

export const getMockOverviewMetrics = (): OverviewMetrics => ({
  totalRevenue: 3605,
  totalExpenses: 2400,
  netProfit: 1205,
  activeCustomers: 432,
  totalOrders: 1254,
});

export const getMockCashflow = (): CashflowPoint[] => [
  { month: "Jan", income: 3200, expenses: 2200, net: 1000 },
  { month: "Feb", income: 3400, expenses: 2300, net: 1100 },
  { month: "Mar", income: 3550, expenses: 2400, net: 1150 },
  { month: "Apr", income: 3700, expenses: 2500, net: 1200 },
  { month: "May", income: 3900, expenses: 2600, net: 1300 },
  { month: "Jun", income: 4100, expenses: 2700, net: 1400 },
];

export const getMockTransactions = (): Transaction[] => [
  {
    id: "t1",
    date: "2025-06-01",
    description: "Online sales",
    category: "Sales",
    type: "income",
    amount: 1200,
    account: "Stripe",
  },
  {
    id: "t2",
    date: "2025-06-02",
    description: "Inventory purchase",
    category: "Inventory",
    type: "expense",
    amount: 650,
    account: "Bank main",
  },
  {
    id: "t3",
    date: "2025-06-03",
    description: "Rent",
    category: "Operations",
    type: "expense",
    amount: 900,
    account: "Bank main",
  },
];
