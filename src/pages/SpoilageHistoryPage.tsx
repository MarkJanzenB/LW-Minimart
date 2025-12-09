import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dbService, SpoilageRecord } from '@/services/database';

function SpoilageHistoryPage() {
  const [spoilage, setSpoilage] = useState<SpoilageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const loadSpoilage = async () => {
      try {
        const records = await dbService.getSpoilageHistory();
        setSpoilage(records.sort((a, b) => b.spoiledAt.localeCompare(a.spoiledAt)));
      } catch (err) {
        console.error('Failed to load spoilage history:', err);
        setError('Failed to load spoilage history');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSpoilage();
  }, []);

  const filteredSpoilage = spoilage
    .filter((record) => {
      if (!searchTerm) return true;
      return record.productName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter((record) => {
      if (!fromDate && !toDate) return true;
      const spoiled = new Date(record.spoiledAt).getTime();
      if (fromDate) {
        const from = new Date(fromDate).setHours(0, 0, 0, 0);
        if (spoiled < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate).setHours(23, 59, 59, 999);
        if (spoiled > to) return false;
      }
      return true;
    });

  const exportSpoilageToCSV = () => {
    const headers = ['Date', 'Product', 'Batch', 'Quantity', 'CostPerUnit', 'TotalCost', 'Reason'];
    const rows = filteredSpoilage.map((r) => [
      new Date(r.spoiledAt).toLocaleString(),
      r.productName,
      r.batchNo,
      String(r.quantity),
      r.costPerUnit.toFixed(2),
      r.totalCost.toFixed(2),
      r.reason || 'Spoilage',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'spoilage_history.csv';
    link.click();
  };

  const exportSpoilageToExcel = () => {
    const headers = ['Date', 'Product', 'Batch', 'Quantity', 'Cost / Unit', 'Total Cost', 'Reason'];
    const tableContent = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${filteredSpoilage
            .map(
              (r) => `
            <tr>
              <td>${new Date(r.spoiledAt).toLocaleString()}</td>
              <td>${r.productName}</td>
              <td>${r.batchNo}</td>
              <td>${r.quantity}</td>
              <td>₱${r.costPerUnit.toFixed(2)}</td>
              <td>₱${r.totalCost.toFixed(2)}</td>
              <td>${r.reason || 'Spoilage'}</td>
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
    link.download = 'spoilage_history.xls';
    link.click();
  };

  const exportSpoilageToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spoilage History</title>
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
          <h1>Spoilage History</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Cost / Unit</th>
                <th>Total Cost</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSpoilage
                .map(
                  (r) => `
                <tr>
                  <td>${new Date(r.spoiledAt).toLocaleString()}</td>
                  <td>${r.productName}</td>
                  <td>${r.batchNo}</td>
                  <td>${r.quantity}</td>
                  <td>₱${r.costPerUnit.toFixed(2)}</td>
                  <td>₱${r.totalCost.toFixed(2)}</td>
                  <td>${r.reason || 'Spoilage'}</td>
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
      win.document.close();
      win.print();
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Spoilage History</h1>
            <p className="text-muted-foreground mt-1">View your spoilage history.</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading spoilage history...</p>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : spoilage.length === 0 ? (
          <p className="text-muted-foreground">No spoilage records found yet.</p>
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
                    onClick={exportSpoilageToCSV}
                    className="glass-button text-sm px-3 py-2"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportSpoilageToExcel}
                    className="glass-button text-sm px-3 py-2"
                  >
                    Export Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportSpoilageToPDF}
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
                    <th>Date</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Quantity</th>
                    <th>Cost / Unit</th>
                    <th>Total Cost</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpoilage.map((record) => (
                      <tr key={record.id}>
                        <td className="text-sm text-muted-foreground">
                          {new Date(record.spoiledAt).toLocaleString()}
                        </td>
                        <td className="font-medium text-foreground">{record.productName}</td>
                        <td className="text-sm text-muted-foreground">{record.batchNo}</td>
                        <td className="tabular-nums">{record.quantity}</td>
                        <td className="tabular-nums">
                          ₱{record.costPerUnit.toFixed(2)}
                        </td>
                        <td className="tabular-nums font-medium">
                          ₱{record.totalCost.toFixed(2)}
                        </td>
                        <td className="text-sm text-muted-foreground">{record.reason || 'Spoilage'}</td>
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

export default SpoilageHistoryPage;
