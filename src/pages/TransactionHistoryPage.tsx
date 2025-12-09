import React, { useState, useMemo } from 'react';
import { Calendar, Search, Receipt } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTransactionStore } from '@/stores/transactionStore';
import { formatCurrency } from '@/hooks/use-currency';

function TransactionHistoryPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return transactions
      .filter(t => 
        t.id.toLowerCase().includes(term) ||
        (t.referenceNumber && t.referenceNumber.toLowerCase().includes(term))
      )
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [transactions, searchTerm, sortOrder]);

  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <Receipt className="w-5 h-5 text-foreground" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground mt-1">View all your POS transactions</p>
          </div>
        </div>
      </div>
      <div className="p-8 h-full flex flex-col">
      
      {/* Filter and Sort Controls */}
      <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border border-border">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by Transaction ID or Reference No..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-ring outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted">
            <Calendar size={16} />
            <span>Filter by Date</span>
          </button>
          <select 
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted bg-background appearance-none"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="flex-1 overflow-y-auto bg-card rounded-lg border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-4 font-medium">Transaction ID</th>
              <th className="p-4 font-medium">Reference No.</th>
              <th className="p-4 font-medium">Payment</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Items</th>
              <th className="p-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                <td className="p-4 font-mono text-xs">{t.id}</td>
                <td className="p-4 font-mono text-xs">{t.referenceNumber || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${t.paymentMethod === 'cash' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {t.paymentMethod === 'cash' ? 'Cash' : 'QR'}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{new Date(t.date).toLocaleString()}</td>
                <td className="p-4 text-muted-foreground">{t.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td className="p-4 font-semibold text-right">{formatCurrency(t.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No transactions found.</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default TransactionHistoryPage;
