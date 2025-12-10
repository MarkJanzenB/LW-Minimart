import React, { useEffect, useState, useMemo } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AlertTriangle, Search, Download, FileText, FileSpreadsheet, File, TrendingDown, Package, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/hooks/use-currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SpoilageRecord {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  batchNo?: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  expiryDate?: string;
  spoiledAt: string;
  reason?: string;
}

function SpoilageHistoryPage() {
  const [spoilage, setSpoilage] = useState<SpoilageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stats, setStats] = useState({ totalRecords: 0, totalQuantity: 0, totalCost: 0 });

  const loadSpoilage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const api = (window as any).api;
      if (!api?.spoilage?.getAll) {
        throw new Error('Spoilage API not available');
      }

      const response = await api.spoilage.getAll();
      if (response.success && Array.isArray(response.data)) {
        const records: SpoilageRecord[] = response.data.map((r: any) => ({
          id: r.id,
          productId: r.productId || r.product_id,
          productName: r.productName || r.product_name,
          sku: r.sku,
          batchNo: r.batchNo || r.batch_code || r.batchNo,
          quantity: Number(r.quantity || 0),
          costPerUnit: Number(r.costPerUnit || r.cost_per_unit || 0),
          totalCost: Number(r.totalCost || r.total_cost || 0),
          expiryDate: r.expiryDate || r.expiry_date,
          spoiledAt: r.spoiledAt || r.spoiled_at,
          reason: r.reason || 'Expired',
        }));
        setSpoilage(records.sort((a, b) => new Date(b.spoiledAt).getTime() - new Date(a.spoiledAt).getTime()));
      } else {
        setSpoilage([]);
      }

      // Load stats
      if (api.spoilage.getStats) {
        const statsResponse = await api.spoilage.getStats();
        if (statsResponse.success && statsResponse.data) {
          setStats({
            totalRecords: statsResponse.data.totalRecords || 0,
            totalQuantity: statsResponse.data.totalQuantity || 0,
            totalCost: statsResponse.data.totalCost || 0,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load spoilage history:', err);
      setError(err.message || 'Failed to load spoilage history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSpoilage();
  }, []);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadSpoilage();
      }
    };

    const handleFocus = () => {
      void loadSpoilage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const filteredSpoilage = useMemo(() => {
    return spoilage.filter((record) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !record.productName.toLowerCase().includes(searchLower) &&
          !(record.sku?.toLowerCase().includes(searchLower)) &&
          !(record.batchNo?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      // Date filter
      if (fromDate || toDate) {
        const spoiled = new Date(record.spoiledAt).getTime();
        if (fromDate) {
          const from = new Date(fromDate).setHours(0, 0, 0, 0);
          if (spoiled < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate).setHours(23, 59, 59, 999);
          if (spoiled > to) return false;
        }
      }

      return true;
    });
  }, [spoilage, searchTerm, fromDate, toDate]);

  const filteredStats = useMemo(() => {
    const totalQuantity = filteredSpoilage.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = filteredSpoilage.reduce((sum, r) => sum + r.totalCost, 0);
    return {
      totalRecords: filteredSpoilage.length,
      totalQuantity,
      totalCost,
    };
  }, [filteredSpoilage]);

  const exportSpoilageToCSV = () => {
    const headers = ['Date', 'Product', 'SKU', 'Batch', 'Quantity', 'Cost Per Unit', 'Total Cost', 'Reason'];
    const rows = filteredSpoilage.map((r) => [
      new Date(r.spoiledAt).toLocaleString(),
      r.productName,
      r.sku || '',
      r.batchNo || '',
      String(r.quantity),
      r.costPerUnit.toFixed(2),
      r.totalCost.toFixed(2),
      r.reason || 'Expired',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `spoilage_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportSpoilageToExcel = () => {
    const headers = ['Date', 'Product', 'SKU', 'Batch', 'Quantity', 'Cost / Unit', 'Total Cost', 'Reason'];
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
              <td>${r.sku || ''}</td>
              <td>${r.batchNo || ''}</td>
              <td>${r.quantity}</td>
              <td>${formatCurrency(r.costPerUnit)}</td>
              <td>${formatCurrency(r.totalCost)}</td>
              <td>${r.reason || 'Expired'}</td>
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
    link.download = `spoilage_history_${new Date().toISOString().split('T')[0]}.xls`;
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
            h1 { color: #dc2626; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #dc2626; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Spoilage History Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>SKU</th>
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
                  <td>${r.sku || ''}</td>
                  <td>${r.batchNo || ''}</td>
                  <td>${r.quantity}</td>
                  <td>${formatCurrency(r.costPerUnit)}</td>
                  <td>${formatCurrency(r.totalCost)}</td>
                  <td>${r.reason || 'Expired'}</td>
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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Spoilage History</h1>
            <p className="text-muted-foreground mt-1">Track and manage spoiled products.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading spoilage history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
              <div className="rounded-2xl border border-red-100 bg-red-50/80 dark:bg-red-950/20 dark:border-red-900/50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    Total Records
                  </p>
                  <p className="mt-2 text-3xl font-bold text-red-900 dark:text-red-300">{filteredStats.totalRecords}</p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Matching current filters</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50/80 dark:bg-orange-950/20 dark:border-orange-900/50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                    Total Quantity
                  </p>
                  <p className="mt-2 text-3xl font-bold text-orange-900 dark:text-orange-300">{filteredStats.totalQuantity}</p>
                  <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">Spoiled items</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-900/50 p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Total Cost
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-300">{formatCurrency(filteredStats.totalCost)}</p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Loss from spoilage</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filters and Export */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-xs font-medium text-muted-foreground mb-1">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by product name, SKU, or batch..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fromDate" className="text-xs font-medium text-muted-foreground mb-1">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="toDate" className="text-xs font-medium text-muted-foreground mb-1">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportSpoilageToCSV}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportSpoilageToExcel}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportSpoilageToPDF}
                    className="flex items-center gap-2"
                  >
                    <File className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            {filteredSpoilage.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No spoilage records found.</p>
                {searchTerm || fromDate || toDate ? (
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
                ) : null}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-3 text-left font-semibold text-muted-foreground text-xs uppercase">Date</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground text-xs uppercase">Product</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground text-xs uppercase">SKU</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground text-xs uppercase">Batch</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground text-xs uppercase">Quantity</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground text-xs uppercase">Cost / Unit</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground text-xs uppercase">Total Cost</th>
                        <th className="p-3 text-left font-semibold text-muted-foreground text-xs uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSpoilage.map((record) => (
                        <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(record.spoiledAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-medium text-foreground">{record.productName}</td>
                          <td className="p-3 text-sm text-muted-foreground font-mono">{record.sku || '-'}</td>
                          <td className="p-3 text-sm text-muted-foreground">{record.batchNo || '-'}</td>
                          <td className="p-3 text-right tabular-nums font-medium">{record.quantity}</td>
                          <td className="p-3 text-right tabular-nums text-muted-foreground">
                            {formatCurrency(record.costPerUnit)}
                          </td>
                          <td className="p-3 text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(record.totalCost)}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                              {record.reason || 'Expired'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default SpoilageHistoryPage;
