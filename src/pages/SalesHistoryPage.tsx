import React, { useMemo, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp, Search, CircleDollarSign } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatCurrency } from '@/hooks/use-currency';

function SalesHistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions);

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'qr'>('all');

  const { totalSales, totalTransactions, filteredTransactions } = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = transactions.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(term) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(term));

      const matchesPayment =
        paymentFilter === 'all' ? true : t.paymentMethod === paymentFilter;

      return matchesSearch && matchesPayment;
    });

    let totalSales = 0;
    filtered.forEach((t) => {
      totalSales += t.total;
    });

    return {
      totalSales,
      totalTransactions: filtered.length,
      filteredTransactions: filtered,
    };
  }, [transactions, searchTerm, paymentFilter]);
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
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                Total Transactions
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{totalTransactions}</p>
              <p className="mt-1 text-xs text-emerald-600">Matching current filters</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                Net Sales
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-900">{formatCurrency(totalSales)}</p>
              <p className="mt-1 text-xs text-amber-600">Total of filtered sales</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-3">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID or Reference No."
                className="w-full pl-9 pr-3 py-2 rounded-full border border-border bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground hidden md:inline">
                Payment
              </span>
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  paymentFilter === 'all'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('cash')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  paymentFilter === 'cash'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('qr')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  paymentFilter === 'qr'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                QR
              </button>
            </div>
          </div>
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions match your filters.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 font-medium">ID</th>
                    <th className="p-2 font-medium">Reference No.</th>
                    <th className="p-2 font-medium">Payment</th>
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 20).map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-b-0">
                      <td className="p-2 font-mono text-xs">{t.id}</td>
                      <td className="p-2 font-mono text-xs">{t.paymentMethod === 'qr' && t.referenceNumber ? t.referenceNumber : '-'}</td>
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
