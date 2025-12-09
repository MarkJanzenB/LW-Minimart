import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Search, SlidersHorizontal } from 'lucide-react';
import { Transaction } from '@/integrations/supabase/types';

function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Fetch transactions from database
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await (window as any).api.transactions.getAll();
        if (response.success && response.data) {
          // Map database transactions to Transaction interface
          const mappedTransactions: Transaction[] = response.data.map((t: any) => {
            // Parse items if stored as JSON string, otherwise use empty array
            let items: any[] = [];
            try {
              items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
            } catch (e) {
              console.error('Failed to parse transaction items:', e);
            }

            return {
              id: t.transaction_id || t.id.toString(),
              date: new Date(t.date || t.created_at),
              items: items.map((item: any) => ({
                id: item.product_id?.toString() || item.id?.toString() || '',
                name: item.product_name || 'Unknown Product',
                code: item.product_barcode || '',
                price: parseFloat(item.unit_price) || 0,
                stock: 0,
                category: '',
                quantity: parseInt(item.quantity) || 0,
              })),
              subtotal: parseFloat(t.subtotal) || 0,
              tax: parseFloat(t.tax) || parseFloat(t.tax_amount) || 0,
              total: parseFloat(t.total) || parseFloat(t.total_amount) || 0,
              paymentMethod: t.payment_method || 'cash',
              status: t.status || 'Completed',
            };
          });
          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [transactions, searchTerm, sortOrder]);

  const handleRefund = async (transactionId: string) => {
    // TODO: Implement refund in database
    // For now, just update local state
    setTransactions(prev => 
      prev.map(t => t.id === transactionId ? { ...t, status: 'Refunded' } : t)
    );
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-foreground mb-6">Transaction History</h1>
      
      {/* Filter and Sort Controls */}
      <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border border-border">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by Transaction ID..."
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-4 text-muted-foreground">Loading transactions...</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="p-4 font-medium">Transaction ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
              <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                <td className="p-4 font-mono text-xs">{t.id}</td>
                <td className="p-4 text-muted-foreground">{new Date(t.date).toLocaleString()}</td>
                <td className="p-4 text-muted-foreground">{t.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                <td className="p-4 font-semibold text-right">₱{t.total.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${t.status === 'Refunded' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {t.status || 'Completed'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {t.status !== 'Refunded' && (
                    <button 
                      onClick={() => handleRefund(t.id)}
                      className="px-3 py-1 border border-border rounded-md text-xs font-medium hover:bg-muted/80 bg-muted"
                    >
                      Refund
                    </button>
                  )}
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionHistoryPage;
