import { create } from 'zustand';
import { Transaction } from '@/integrations/supabase/types';

interface TransactionStoreState {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: [],
  setTransactions: (txs) => set({ transactions: txs }),
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
}));
