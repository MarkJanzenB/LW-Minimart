import { create } from 'zustand';
import { Transaction } from '@/integrations/supabase/types';
import { MOCK_TRANSACTIONS } from '@/constants';

interface TransactionStoreState {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: MOCK_TRANSACTIONS,
  setTransactions: (txs) => set({ transactions: txs }),
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
}));
