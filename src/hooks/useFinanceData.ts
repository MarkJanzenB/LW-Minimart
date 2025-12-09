import { useQuery } from "@tanstack/react-query";
import { getMockCashflow, getMockOverviewMetrics, getMockTransactions } from "@/lib/finance-data";

export const financeQueryKeys = {
  overview: ["finance", "overview"] as const,
  cashflow: ["finance", "cashflow"] as const,
  transactions: ["finance", "transactions"] as const,
};

export const useOverviewMetrics = () => {
  return useQuery({
    queryKey: financeQueryKeys.overview,
    queryFn: async () => {
      // Simulate slight latency for better UX testing
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockOverviewMetrics();
    },
  });
};

export const useCashflow = () => {
  return useQuery({
    queryKey: financeQueryKeys.cashflow,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockCashflow();
    },
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: financeQueryKeys.transactions,
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return getMockTransactions();
    },
  });
};
