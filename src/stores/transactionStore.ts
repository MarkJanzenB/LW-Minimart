import { create } from 'zustand';
import { Transaction } from '@/integrations/supabase/types';
import { MOCK_TRANSACTIONS } from '@/constants';

interface TransactionStoreState {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  refundTransaction: (id: string) => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: MOCK_TRANSACTIONS,
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  refundTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, status: 'Refunded' } : t
      ),
    })),
}));
