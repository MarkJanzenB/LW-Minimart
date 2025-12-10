import React, { useEffect, useMemo, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrendingUp, Search, CircleDollarSign, Loader2 } from 'lucide-react';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatCurrency } from '@/hooks/use-currency';

function SalesHistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const setTransactions = useTransactionStore((state) => state.setTransactions);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailItems, setDetailItems] = useState<
    { product_id: number | null; product_name?: string; quantity: number; unit_price: number; subtotal: number }[]
  >([]);
  const [detailTxn, setDetailTxn] = useState<{
    id: string;
    date: Date;
    total: number;
    subtotal: number;
    tax: number;
    paymentMethod: string;
    referenceNumber?: string;
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load persisted transactions from Electron (SQLite)
  const loadTransactions = async () => {
    try {
      const api = (window as any).api;
      if (!api?.transactions?.getAll) return;
      const res = await api.transactions.getAll();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((row: any) => ({
          id: (row.transaction_id ?? row.id)?.toString?.() ?? '',
          date: row.date ?? row.created_at ? new Date(row.date ?? row.created_at) : new Date(),
          items: Array.isArray(row.items) ? row.items : [],
          subtotal: Number(row.subtotal ?? 0),
          tax: Number(row.tax ?? row.tax_amount ?? 0),
          total: Number(row.total ?? row.total_amount ?? 0),
          cashReceived: row.cash_received ?? undefined,
          change: row.change ?? undefined,
          paymentMethod: row.payment_method === 'qr' ? 'qr' : 'cash',
          referenceNumber: row.reference_number ?? undefined,
          status: (row.status || 'Completed') as 'Completed' | 'Refunded' | 'Cancelled',
        }));
        setTransactions(mapped);
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        // Clear transactions if database returns empty array
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load sales history:', error);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [setTransactions]);

  // Refresh transactions when page becomes visible or gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadTransactions();
      }
    };

    const handleFocus = () => {
      void loadTransactions();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [setTransactions]);

  // Also listen to transaction store updates (when transactions are added in POS)
  useEffect(() => {
    // Refresh when store transactions change (new transaction added)
    void loadTransactions();
  }, [transactions.length, setTransactions]);

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

  const openDetails = async (id: string) => {
    try {
      const api = (window as any).api;
      if (!api?.transactions?.getById) return;
      setLoadingDetail(true);
      const res = await api.transactions.getById(id);
      if (res.success && res.data) {
        const txn = res.data;
        setDetailTxn({
          id: txn.transaction_id ?? id,
          date: txn.created_at ? new Date(txn.created_at) : new Date(),
          total: Number(txn.total_amount ?? 0),
          subtotal: Number(txn.subtotal ?? 0),
          tax: Number(txn.tax_amount ?? 0),
          paymentMethod: txn.payment_method === 'qr' ? 'QR' : 'Cash',
          referenceNumber: txn.reference_number ?? undefined,
        });
        setDetailItems(
          Array.isArray(txn.items)
            ? txn.items.map((it: any) => ({
                product_id: it.product_id ?? null,
                product_name: it.product_name ?? it.name ?? it.product_name ?? undefined,
                quantity: Number(it.quantity ?? 0),
                unit_price: Number(it.unit_price ?? 0),
                subtotal: Number(it.subtotal ?? 0),
              }))
            : []
        );
        setIsDetailsOpen(true);
      }
    } catch (err) {
      console.error('Failed to load transaction details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

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
              <table className="w-full text-sm text-left border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted/80 sticky top-0 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 font-semibold">ID</th>
                    <th className="p-2 font-semibold">Reference No.</th>
                    <th className="p-2 font-semibold">Payment</th>
                    <th className="p-2 font-semibold">Date</th>
                    <th className="p-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 20).map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/40 cursor-pointer"
                      onClick={() => openDetails(t.id)}
                    >
                      <td className="p-2 font-mono text-xs text-blue-700 underline">{t.id}</td>
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

      {isDetailsOpen && detailTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-semibold">Transaction</p>
                <p className="font-mono text-sm text-blue-700">{detailTxn.id}</p>
                <p className="text-xs text-muted-foreground">{detailTxn.date.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="text-sm px-3 py-1 rounded-md border border-border hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment</p>
                  <p className="font-medium">{detailTxn.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Reference</p>
                  <p className="font-medium">{detailTxn.referenceNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Subtotal</p>
                  <p className="font-semibold">{formatCurrency(detailTxn.subtotal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tax</p>
                  <p className="font-semibold">{formatCurrency(detailTxn.tax)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(detailTxn.total)}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/60 px-4 py-2 text-sm font-semibold">Items</div>
                <div className="divide-y divide-border">
                  {loadingDetail ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading items...
                    </div>
                  ) : detailItems.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No items found for this transaction.</div>
                  ) : (
                    detailItems.map((it, idx) => (
                      <div key={idx} className="px-4 py-3 text-sm grid grid-cols-6 gap-2 items-center">
                        <div className="col-span-3">
                          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Product</p>
                          <p className="font-medium">
                            {it.product_name || (it.product_id ? `ID: ${it.product_id}` : 'Unknown product')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Qty</p>
                          <p className="font-semibold">{it.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Unit Price</p>
                          <p>{formatCurrency(it.unit_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Subtotal</p>
                          <p className="font-semibold">{formatCurrency(it.subtotal)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SalesHistoryPage;
