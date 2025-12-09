import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dbService, RestockRecord } from '@/services/database';

function RestockHistoryPage() {
  const [restocks, setRestocks] = useState<RestockRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const loadRestocks = async () => {
      try {
        const records = await dbService.getRestockHistory();
        setRestocks(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch (err) {
        console.error('Failed to load restock history:', err);
        setError('Failed to load restock history');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRestocks();
  }, []);

  const filteredRestocks = restocks
    .filter((record) => {
      if (!searchTerm) return true;
      return record.productName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter((record) => {
      if (!fromDate && !toDate) return true;
      const created = new Date(record.createdAt).getTime();
      if (fromDate) {
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (created < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate).setHours(23, 59, 59, 999);
        if (created > to) return false;
      }
      return true;
    });

  const exportRestocksToCSV = () => {
    const headers = ['DateRestocked', 'Product', 'OriginalSKU', 'RestockSKU', 'Quantity', 'Batch', 'ExpiryDate', 'Barcode'];
    const rows = filteredRestocks.map((r) => [
      new Date(r.createdAt).toLocaleString(),
      r.productName,
      r.originalSku,
      r.restockSku,
      String(r.quantity),
      r.batchNo,
      r.expiryDate,
      r.barcode,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'restock_history.csv';
    link.click();
  };

  const exportRestocksToExcel = () => {
    const headers = ['Date Restocked', 'Product', 'Original SKU', 'Restock SKU', 'Quantity', 'Batch', 'Expiry Date', 'Barcode'];
    const tableContent = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${filteredRestocks
            .map(
              (r) => `
            <tr>
              <td>${new Date(r.createdAt).toLocaleString()}</td>
              <td>${r.productName}</td>
              <td>${r.originalSku}</td>
              <td>${r.restockSku}</td>
              <td>${r.quantity}</td>
              <td>${r.batchNo}</td>
              <td>${r.expiryDate}</td>
              <td>${r.barcode}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'restock_history.xls';
    link.click();
  };

  const exportRestocksToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Restock History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #046241; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #046241; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Restock History</h1>
          <table>
            <thead>
              <tr>
                <th>Date Restocked</th>
                <th>Product</th>
                <th>Original SKU</th>
                <th>Restock SKU</th>
                <th>Quantity</th>
                <th>Batch</th>
                <th>Expiry Date</th>
                <th>Barcode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRestocks
                .map(
                  (r) => `
                <tr>
                  <td>${new Date(r.createdAt).toLocaleString()}</td>
                  <td>${r.productName}</td>
                  <td>${r.originalSku}</td>
                  <td>${r.restockSku}</td>
                  <td>${r.quantity}</td>
                  <td>${r.batchNo}</td>
                  <td>${r.expiryDate}</td>
                  <td>${r.barcode}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const win = printWindow as unknown as Window;
      win.document.write(printContent);
      win.document.close();n+      win.print();
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Restock History</h1>
            <p className="text-muted-foreground mt-1">View your restock history.</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading restock history...</p>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : restocks.length === 0 ? (
          <p className="text-muted-foreground">No restock records found yet.</p>
        ) : (
          <>
            <div className="glass-card p-4 mb-6 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Search by product</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type product name..."
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">From date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">To date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div className="flex gap-2 md:ml-auto">
                  <button
                    type="button"
                    onClick={exportRestocksToCSV}
                    className="glass-button text-sm px-3 py-2"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportRestocksToExcel}
                    className="glass-button text-sm px-3 py-2"
                  >
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportRestocksToPDF}
                    className="glass-button text-sm px-3 py-2"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date Restocked</th>
                    <th>Product</th>
                    <th>Original SKU</th>
                    <th>Restock SKU</th>
                    <th>Quantity</th>
                    <th>Batch</th>
                    <th>Expiry Date</th>
                    <th>Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestocks.map((record) => (
                      <tr key={record.id}>
                        <td className="text-sm text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                        <td className="font-medium text-foreground">{record.productName}</td>
                        <td className="text-sm text-muted-foreground">{record.originalSku}</td>
                        <td className="text-sm text-muted-foreground">{record.restockSku}</td>
                        <td className="tabular-nums">{record.quantity}</td>
                        <td className="text-sm text-muted-foreground">{record.batchNo}</td>
                        <td className="text-sm text-muted-foreground">{record.expiryDate}</td>
                        <td className="text-sm text-muted-foreground">{record.barcode}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default RestockHistoryPage;
