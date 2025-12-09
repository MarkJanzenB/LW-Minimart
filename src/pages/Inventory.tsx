import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  Filter,
  LayoutGrid,
  List,
  Upload,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

// TypeScript Interface
interface InventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  expiryDate: string;
  status: string;
  batchNo: string;
  barcode: string;
  imageUrl?: string;
}

// Traffic Light Helper Functions
const isExpired = (expiryDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return expiry < today;
};

const isLowStock = (stock: number, minStock: number): boolean => {
  return stock > 0 && stock < minStock;
};

const getRowClassName = (item: InventoryItem): string => {
  if (isExpired(item.expiryDate)) {
    return "row-expired"; // Red
  }
  if (isLowStock(item.stock, item.minStock)) {
    return "row-low-stock"; // Yellow
  }
  return "";
};

// Sample data removed - now fetched from database

type SortKey = keyof InventoryItem;
type SortDirection = "asc" | "desc";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

  // Fetch inventory from database
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await (window as any).api.products.getInventory();
        if (response.success && response.data) {
          // Map database data to InventoryItem interface
          const mappedData: InventoryItem[] = response.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            price: parseFloat(item.price) || 0,
            stock: parseInt(item.stock) || 0,
            minStock: parseInt(item.minStock) || 0,
            category: item.category || 'Uncategorized',
            expiryDate: item.expiryDate || '',
            status: item.status || 'In Stock',
            batchNo: item.batchNo || '',
            barcode: item.barcode || '',
          }));
          setInventoryData(mappedData);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Get unique categories from inventory data
  const categories = useMemo(() => {
    return ["All", ...new Set(inventoryData.map((item) => item.category))];
  }, [inventoryData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const lowStock = inventoryData.filter((item) => item.stock > 0 && item.stock <= item.minStock).length;
    const inStock = inventoryData.filter((item) => item.status === "In Stock").length;
    const expired = inventoryData.filter((item) => item.status === "Expired").length;
    return { lowStock, inStock, expired };
  }, [inventoryData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...inventoryData];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.batchNo.toLowerCase().includes(term) ||
          item.barcode.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      data = data.filter((item) => item.category === selectedCategory);
    }

    // Low stock filter
    if (showLowStockOnly) {
      data = data.filter((item) => item.stock <= 10);
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return data;
  }, [inventoryData, searchTerm, selectedCategory, showLowStockOnly, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Price", "Stock", "Category", "Expiry Date", "Status", "Batch No.", "Barcode"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          item.id,
          `"${item.name}"`,
          item.price,
          item.stock,
          item.category,
          item.expiryDate,
          item.status,
          item.batchNo,
          item.barcode,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_export.csv";
    link.click();
    setIsExportMenuOpen(false);
  };

  const exportToExcel = () => {
    // Create a simple HTML table format that Excel can read
    const headers = ["ID", "Name", "Price", "Stock", "Category", "Expiry Date", "Status", "Batch No.", "Barcode"];
    const tableContent = `
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${filteredData
            .map(
              (item) => `
            <tr>
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${item.price}</td>
              <td>${item.stock}</td>
              <td>${item.category}</td>
              <td>${item.expiryDate}</td>
              <td>${item.status}</td>
              <td>${item.batchNo}</td>
              <td>${item.barcode}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory_export.xls";
    link.click();
    setIsExportMenuOpen(false);
  };

  const exportToPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #046241; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #046241; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .date { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Report</h1>
            <p class="date">Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Batch No.</th>
                <th>Barcode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (item) => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.name}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>${item.stock}</td>
                  <td>${item.category}</td>
                  <td>${item.expiryDate}</td>
                  <td>${item.status}</td>
                  <td>${item.batchNo}</td>
                  <td>${item.barcode}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank") as any;
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    setIsExportMenuOpen(false);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Expired":
        return <span className="badge-expired">{status}</span>;
      case "Low Stock":
        return <span className="badge-low-stock">{status}</span>;
      case "In Stock":
        return <span className="badge-in-stock">{status}</span>;
      default:
        return <span className="badge-in-stock">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-8 py-6 flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
              <p className="text-muted-foreground mt-1">Track and manage your products.</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card-warning animate-fade-in-up opacity-0" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Low Stock Items</p>
                <p className="text-4xl font-display font-bold text-foreground">{stats.lowStock}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="stat-card-success animate-fade-in-up opacity-0" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">In Stock Items</p>
                <p className="text-4xl font-display font-bold text-foreground">{stats.inStock}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="stat-card-light-warning animate-fade-in-up opacity-0" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Expired Products</p>
                <p className="text-4xl font-display font-bold text-foreground">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center">
                <Package className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, batch no, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-12 pr-4"
                />
              </div>

              {/* Low Stock Toggle */}
              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`glass-button flex items-center gap-2 ${
                  showLowStockOnly ? "bg-inventory-warning/30 border-inventory-warning" : ""
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Low Stock Only</span>
              </button>

              {/* Export Button */}
              <div className="relative z-10">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="glass-button flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass-card py-2 z-50 animate-scale-in">
                    <button
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 text-sm"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 text-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      <span>Export Excel</span>
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 text-sm"
                    >
                      <FileText className="w-4 h-4 text-accent" />
                      <span>Export PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('list')} className={`glass-button ${viewMode === 'list' ? 'bg-primary/20' : ''}`}>
                  <List className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('card')} className={`glass-button ${viewMode === 'card' ? 'bg-primary/20' : ''}`}>
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>

              {/* Add Product Button */}
              <button onClick={() => setIsModalOpen(true)} className="glass-button-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                    selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table or Card View */}
        <div
          className="glass-card overflow-hidden animate-fade-in-up opacity-0"
          style={{ animationDelay: "500ms" }}
        >
          {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="modern-table">
              <thead>
                <tr>
                  {[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Product" },
                    { key: "price", label: "Price" },
                    { key: "stock", label: "Stock" },
                    { key: "category", label: "Category" },
                    { key: "expiryDate", label: "Expiry" },
                    { key: "status", label: "Status" },
                    { key: "batchNo", label: "Batch" },
                    { key: "barcode", label: "Barcode" },
                  ].map((col, idx) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as SortKey)}
                      className={`cursor-pointer hover:bg-muted transition-colors ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === 8 ? 'rounded-tr-xl' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        <ArrowUpDown
                          className={`w-3 h-3 ${
                            sortKey === col.key ? "text-primary" : "text-muted-foreground/50"
                          }`}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
              {paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`${getRowClassName(item)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td className="font-medium text-foreground">{item.name}</td>
                    <td className="tabular-nums">${item.price.toFixed(2)}</td>
                    <td>
                      <span
                        className={`font-semibold tabular-nums ${
                          isExpired(item.expiryDate)
                            ? "text-destructive"
                            : isLowStock(item.stock, item.minStock)
                              ? "text-accent"
                              : "text-primary"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{item.category}</td>
                    <td className="text-muted-foreground tabular-nums">{item.expiryDate}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td className="font-mono text-xs text-muted-foreground">{item.batchNo}</td>
                    <td className="font-mono text-xs text-muted-foreground">{item.barcode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {paginatedData.map((item, index) => (
                <div key={item.id} className={`glass-card p-4 flex flex-col ${getRowClassName(item)}`} style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="w-full h-40 bg-muted rounded-lg mb-4 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/40" />
                    )}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg text-primary">${item.price.toFixed(2)}</span>
                    <span className={`font-semibold ${isLowStock(item.stock, item.minStock) ? 'text-accent' : 'text-primary'}`}>{item.stock} in stock</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Batch: {item.batchNo}</p>
                    <p>Expiry: {item.expiryDate}</p>
                    <p className="font-mono mt-1">{item.barcode}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          )}

          {filteredData.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{paginatedData.length}</span> of <span className="font-medium text-foreground">{filteredData.length}</span> items
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="glass-button disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="glass-button disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="glass-modal relative w-full max-w-lg p-8 animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">Add New Product</h2>
              <p className="text-muted-foreground mt-2 text-sm">Fill in the product details below</p>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                  <input type="text" placeholder="Enter name" className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                  <input type="number" placeholder="0.00" className="glass-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stock</label>
                  <input type="number" placeholder="0" className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select className="glass-input w-full">
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Batch No.</label>
                  <input type="text" placeholder="BT-XXXX-XXX" className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Expiry Date</label>
                  <input type="date" className="glass-input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Image</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div> 
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Barcode</label>
                <input type="text" placeholder="Enter barcode" className="glass-input w-full" />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-button flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-button-primary flex-1">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
