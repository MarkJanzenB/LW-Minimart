import React, { useMemo } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatCurrency } from '@/hooks/use-currency';

function SalesHistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions);

  const { totalSales, totalTransactions, totalRefunded } = useMemo(() => {
    let totalSales = 0;
    let totalTransactions = transactions.length;
    let totalRefunded = 0;

    transactions.forEach((t) => {
      if (t.status === 'Refunded') {
        totalRefunded += t.total;
      } else {
        totalSales += t.total;
      }
    });

    return { totalSales, totalTransactions, totalRefunded };
  }, [transactions]);
  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <TrendingUp className="w-5 h-5 text-foreground" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales History</h1>
            <p className="text-muted-foreground mt-1">View your sales history.</p>
          </div>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold mt-1">{totalTransactions}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Net Sales</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalRefunded)}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 font-medium">ID</th>
                    <th className="p-2 font-medium">Payment</th>
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-b-0">
                      <td className="p-2 font-mono text-xs">{t.id}</td>
                      <td className="p-2 text-xs">
                        <span className={`px-2 py-1 rounded-full font-medium ${t.paymentMethod === 'cash' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {t.paymentMethod === 'cash' ? 'Cash' : 'QR'}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{new Date(t.date).toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SalesHistoryPage;
