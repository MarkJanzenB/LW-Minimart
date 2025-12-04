import React, { useState, useMemo } from "react";
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
  Scan,
  TrendingUp,
  Calendar,
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
  switch (item.status) {
    case "Expired":
      return "row-expired bg-red-50 border-l-4 border-l-red-500"; // Red
    case "Low Stock":
      return "row-low-stock bg-orange-50 border-l-4 border-l-orange-500"; // Yellow
    case "In Stock":
      return "row-in-stock bg-green-50 border-l-4 border-l-green-500"; // Green
    default:
      return "row-in-stock bg-green-50 border-l-4 border-l-green-500"; // Default to green
  }
};

// Sample Data
const sampleInventoryData: InventoryItem[] = [
  {
    id: "INV001",
    name: "Organic Green Tea",
    price: 24.99,
    stock: 145,
    minStock: 20,
    category: "Beverages",
    expiryDate: "2025-08-15",
    status: "In Stock",
    batchNo: "BT-2024-001",
    barcode: "8901234567890",
  },
  {
    id: "INV002",
    name: "Premium Coffee Beans",
    price: 34.50,
    stock: 8,
    minStock: 15,
    category: "Beverages",
    expiryDate: "2025-06-20",
    status: "Low Stock",
    batchNo: "BT-2024-002",
    barcode: "8901234567891",
  },
  {
    id: "INV003",
    name: "Almond Butter",
    price: 12.99,
    stock: 25,
    minStock: 10,
    category: "Food",
    expiryDate: "2024-11-30",
    status: "Expired",
    batchNo: "BT-2024-003",
    barcode: "8901234567892",
  },
  {
    id: "INV004",
    name: "Vitamin D3 Supplements",
    price: 18.75,
    stock: 234,
    minStock: 30,
    category: "Health",
    expiryDate: "2026-03-10",
    status: "In Stock",
    batchNo: "BT-2024-004",
    barcode: "8901234567893",
  },
  {
    id: "INV005",
    name: "Coconut Oil",
    price: 9.99,
    stock: 5,
    minStock: 15,
    category: "Food",
    expiryDate: "2025-12-01",
    status: "Low Stock",
    batchNo: "BT-2024-005",
    barcode: "8901234567894",
  },
  {
    id: "INV006",
    name: "Protein Powder",
    price: 45.00,
    stock: 67,
    minStock: 20,
    category: "Health",
    expiryDate: "2025-09-25",
    status: "In Stock",
    batchNo: "BT-2024-006",
    barcode: "8901234567895",
  },
  {
    id: "INV007",
    name: "Herbal Shampoo",
    price: 14.25,
    stock: 3,
    minStock: 10,
    category: "Personal Care",
    expiryDate: "2024-10-15",
    status: "Expired",
    batchNo: "BT-2024-007",
    barcode: "8901234567896",
  },
  {
    id: "INV008",
    name: "Quinoa Seeds",
    price: 8.50,
    stock: 189,
    minStock: 25,
    category: "Food",
    expiryDate: "2026-01-20",
    status: "In Stock",
    batchNo: "BT-2024-008",
    barcode: "8901234567897",
  },
  {
    id: "INV009",
    name: "Essential Oil Set",
    price: 29.99,
    stock: 10,
    minStock: 12,
    category: "Personal Care",
    expiryDate: "2025-07-30",
    status: "Low Stock",
    batchNo: "BT-2024-009",
    barcode: "8901234567898",
  },
  {
    id: "INV010",
    name: "Matcha Powder",
    price: 22.00,
    stock: 56,
    minStock: 15,
    category: "Beverages",
    expiryDate: "2025-11-15",
    status: "In Stock",
    batchNo: "BT-2024-010",
    barcode: "8901234567899",
  },
  {
    id: "INV011",
    name: "Honey Raw Organic",
    price: 16.50,
    stock: 2,
    minStock: 10,
    category: "Food",
    expiryDate: "2024-09-01",
    status: "Expired",
    batchNo: "BT-2024-011",
    barcode: "8901234567900",
  },
  {
    id: "INV012",
    name: "Omega-3 Fish Oil",
    price: 28.99,
    stock: 98,
    minStock: 20,
    category: "Health",
    expiryDate: "2025-10-10",
    status: "In Stock",
    batchNo: "BT-2024-012",
    barcode: "8901234567901",
  },
];

// Get unique categories
const categories = ["All", ...new Set(sampleInventoryData.map((item) => item.category))];

type SortKey = keyof InventoryItem;
type SortDirection = "asc" | "desc";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate statistics
  const stats = useMemo(() => {
    const lowStock = sampleInventoryData.filter((item) => item.stock > 0 && item.stock <= 10).length;
    const inStock = sampleInventoryData.filter((item) => item.status === "In Stock").length;
    const expired = sampleInventoryData.filter((item) => item.status === "Expired").length;
    
    // Calculate product in (total stock of in-stock items)
    const productIn = sampleInventoryData
      .filter((item) => item.status === "In Stock")
      .reduce((sum, item) => sum + item.stock, 0);
    
    // Calculate product out (simulated as items that are out of stock)
    const productOut = sampleInventoryData.filter((item) => item.stock === 0).length;
    
    // Find nearest expiration date
    const nonExpiredItems = sampleInventoryData.filter((item) => !isExpired(item.expiryDate));
    const nearestExpiryItem = nonExpiredItems.length > 0 
      ? nonExpiredItems.reduce((nearest, item) => {
          const itemDate = new Date(item.expiryDate);
          const nearestDate = new Date(nearest.expiryDate);
          return itemDate < nearestDate ? item : nearest;
        })
      : null;
    
    const nearestExpiry = nearestExpiryItem ? nearestExpiryItem.expiryDate : null;
    
    // Calculate days until expiry for better display
    const getDaysUntilExpiry = (expiryDate: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };
    
    return { lowStock, inStock, expired, productIn, productOut, nearestExpiry, nearestExpiryItem, getDaysUntilExpiry };
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...sampleInventoryData];

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

    // Expired filter
    if (showExpiredOnly) {
      data = data.filter((item) => item.status === "Expired");
      // Apply category filter to expired results as well
      if (selectedCategory !== "All") {
        data = data.filter((item) => item.category === selectedCategory);
      }
    }

    // Low stock filter (with category filter)
    if (showLowStockOnly) {
      data = data.filter((item) => item.stock <= 10);
      // Apply category filter to low stock results as well
      if (selectedCategory !== "All") {
        data = data.filter((item) => item.category === selectedCategory);
      }
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
  }, [searchTerm, selectedCategory, showLowStockOnly, showExpiredOnly, sortKey, sortDirection]);

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
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
                <p className="text-muted-foreground mt-1">Track and manage your products.</p>
              </div>
            </div>
            
            {/* Export Button in Header */}
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
                <div className="absolute top-full right-0 mt-2 w-48 glass-card py-2 z-[70] animate-scale-in">
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
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product In */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "100ms" }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">+12.5%</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Product In</p>
                  <p className="text-3xl font-bold text-green-900">{stats.productIn}</p>
                  <p className="text-sm text-green-600 mt-1">Total units in stock</p>
                </div>
              </div>
            </div>

            {/* Product Out */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up opacity-0" style={{ animationDelay: "200ms" }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">-3.2%</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Product Out</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.productOut}</p>
                  <p className="text-sm text-orange-600 mt-1">Out of stock items</p>
                </div>
              </div>
            </div>

            {/* Product Expired */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up opacity-0 cursor-pointer" 
              style={{ animationDelay: "300ms" }}
              onClick={() => {
                setShowExpiredOnly(!showExpiredOnly);
                setShowLowStockOnly(false); // Reset low stock filter
                setSelectedCategory("All"); // Reset category
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Alert</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Product Expired</p>
                  <p className="text-3xl font-bold text-red-900">{stats.expired}</p>
                  <p className="text-sm text-red-600 mt-1">Requires attention</p>
                </div>
              </div>
            </div>

            {/* Nearest Expiration Date */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up opacity-0 cursor-pointer" 
              style={{ animationDelay: "400ms" }}
              onClick={() => {
                // Filter to show products with nearest expiry dates
                setSortKey("expiryDate");
                setSortDirection("asc");
                setShowExpiredOnly(false); // Reset expired filter
                setShowLowStockOnly(false); // Reset low stock filter
                setSelectedCategory("All"); // Reset category
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full -mr-10 -mt-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Upcoming</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Nearest Expiry</p>
                  <p className="text-xl font-bold text-blue-900">
                    {stats.nearestExpiry ? new Date(stats.nearestExpiry).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {stats.nearestExpiryItem 
                      ? `${stats.nearestExpiryItem.name} - ${stats.getDaysUntilExpiry(stats.nearestExpiry)} days`
                      : 'No upcoming expiry'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 animate-fade-in-up opacity-0" style={{ animationDelay: "800ms" }}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Scan Button */}
                <button
                  onClick={() => {
                    // Placeholder for scan functionality
                    alert('Scanner functionality would be implemented here');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Scan className="w-4 h-4" />
                  <span className="whitespace-nowrap">Scan</span>
                </button>

                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, batch no, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {/* Low Stock Toggle */}
                <button
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors font-medium ${
                    showLowStockOnly ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-background"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="whitespace-nowrap">Low Stock Only</span>
                </button>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <button onClick={() => setViewMode('list')} className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('card')} className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors ${viewMode === 'card' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Add Product Button */}
                <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Category Buttons */}
              <div className="flex items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md transition-colors text-sm ${
                      selectedCategory === cat
                        ? "bg-[#ffc370] text-foreground"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-background">
                  {[
                    { key: "id", label: "ID", align: "text-left" },
                    { key: "name", label: "Product", align: "text-left" },
                    { key: "price", label: "Price", align: "text-right" },
                    { key: "stock", label: "Stock", align: "text-right" },
                    { key: "category", label: "Category", align: "text-left" },
                    { key: "expiryDate", label: "Expiry", align: "text-left" },
                    { key: "status", label: "Status", align: "text-center" },
                    { key: "batchNo", label: "Batch", align: "text-left" },
                    { key: "barcode", label: "Barcode", align: "text-left" },
                  ].map((col, idx) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as SortKey)}
                      className={`px-4 py-3 font-semibold text-muted-foreground bg-muted/50 border-b border-border cursor-pointer hover:bg-muted/70 transition-colors ${col.align} ${idx === 0 ? 'rounded-tl-lg' : ''} ${idx === 8 ? 'rounded-tr-lg' : ''}`}
                    >
                      <div className={`flex items-center gap-2 ${
                        col.align === 'text-center' ? 'justify-center' : 
                        col.align === 'text-right' ? 'justify-end' : 
                        'justify-start'
                      }`}>
                        <span className="whitespace-nowrap">{col.label}</span>
                        <ArrowUpDown
                          className={`w-3 h-3 shrink-0 ${
                            sortKey === col.key ? "text-primary" : "text-muted-foreground/50"
                          }`}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
              {paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/20 ${getRowClassName(item)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-3 text-left font-mono text-xs text-muted-foreground w-20">{item.id}</td>
                    <td className="px-4 py-3 text-left font-medium text-foreground min-w-40">{item.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums w-24">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right w-20">
                      <span className="font-medium tabular-nums text-foreground">
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left text-muted-foreground w-24">{item.category}</td>
                    <td className="px-4 py-3 text-left text-muted-foreground tabular-nums w-28">{item.expiryDate}</td>
                    <td className="px-4 py-3 text-center w-24">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            item.status === "In Stock"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Low Stock"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left font-mono text-xs text-muted-foreground w-24">{item.batchNo}</td>
                    <td className="px-4 py-3 text-left font-mono text-xs text-muted-foreground w-32">{item.barcode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {paginatedData.map((item, index) => (
                <div key={item.id} className="glass-card p-4 flex flex-col" style={{ animationDelay: `${index * 50}ms` }}>
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
                    <span className="font-semibold text-primary">{item.stock} in stock</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              onClick={() => setIsModalOpen(false)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                  <input type="text" placeholder="Enter name" className="glass-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                  <input type="number" placeholder="0.00" className="glass-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-button w-full sm:flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="glass-button-primary w-full sm:flex-1">
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