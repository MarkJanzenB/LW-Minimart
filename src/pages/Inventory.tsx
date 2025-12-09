import React, { useState, useEffect, useMemo } from "react";
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
  MoreHorizontal,
  MoreVertical,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { dbService, Product } from "@/services/database";
import { toast } from "sonner";
import { AddProductDialog } from "@/components/AddProductDialog";
import { EditProductDialog } from "@/components/EditProductDialog";

// TypeScript Interface
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
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

interface BatchInfo {
  id: string;
  batchNo: string;
  expiryDate: string;
  stock: number;
  status: string;
  barcode: string;
}

interface ProductWithBatches {
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
  batches: BatchInfo[];
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

const getRowClassName = (item: { expiryDate: string; stock: number; minStock: number }): string => {
  if (isExpired(item.expiryDate)) {
    return "row-expired"; // Red
  }
  if (isLowStock(item.stock, item.minStock)) {
    return "row-low-stock"; // Yellow
  }
  return "";
};

// All inventory data comes from database - no sample data
const getCategories = (data: ProductWithBatches[]) => ["All", ...new Set(data.map((item) => item.category))];

type SortKey = keyof ProductWithBatches;
type SortDirection = "asc" | "desc";

const Inventory = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isAdminViewerOpen, setIsAdminViewerOpen] = useState(false);
  const [adminMirror, setAdminMirror] = useState<InventoryItem[]>([]);
  const [isRowDeleteOpen, setIsRowDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<InventoryItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [detailsProduct, setDetailsProduct] = useState<ProductWithBatches | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isSpoilageDialogOpen, setIsSpoilageDialogOpen] = useState(false);
  const [isProcessingSpoilage, setIsProcessingSpoilage] = useState(false);
  const [spoilageSummary, setSpoilageSummary] = useState<{
    products: number;
    totalQuantity: number;
    totalCost: number;
  } | null>(null);
  const [expiredProductsForSpoilage, setExpiredProductsForSpoilage] = useState<Product[]>([]);

  // Fetch products from database on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await dbService.getProducts();
        const activeProducts = products.filter((product) => !(product.status === 'Spoiled' && product.stock === 0));
        // Map database products to InventoryItem format
        const formattedProducts = activeProducts.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          minStock: product.minStock,
          category: product.category,
          expiryDate: product.expiryDate,
          status: product.status,
          batchNo: product.batchNo,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
        }));
        setInventory(formattedProducts);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        if (typeof window === 'undefined' || !window.api || !window.api.auth) return;
        const result = await window.api.auth.getCurrentUser();
        const role = result?.user?.role;
        setIsOwner(role === 'owner');
      } catch (error) {
        console.error('Error checking current user role:', error);
      }
    };

    void checkRole();
  }, []);

  const openRowDeleteDialog = (item: InventoryItem) => {
    setRowToDelete(item);
    setDeleteConfirmText("");
    setIsRowDeleteOpen(true);
  };

  const handleConfirmRowDelete = async () => {
    if (!rowToDelete) return;

    try {
      await dbService.deleteProduct(rowToDelete.id);

      const api = window.api;
      if (api && api.inventory) {
        await api.inventory.delete(rowToDelete.id);
      }

      setInventory((prev) => prev.filter((item) => item.id !== rowToDelete.id));
      await handleProductAdded();

      toast.success(`Deleted product ${rowToDelete.name}`);
      setIsRowDeleteOpen(false);
      setRowToDelete(null);
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleProductAdded = async () => {
    try {
      const products = await dbService.getProducts();
      const activeProducts = products.filter((product) => !(product.status === 'Spoiled' && product.stock === 0));
      const formattedProducts = activeProducts.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        category: product.category,
        expiryDate: product.expiryDate,
        status: product.status,
        batchNo: product.batchNo,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
      }));
      setInventory(formattedProducts);
    } catch (error) {
      console.error("Error refreshing products:", error);
      toast.error("Failed to refresh products");
    }
  };

  const handleProductUpdatedOrDeleted = async () => {
    await handleProductAdded();
  };

  const openAdminViewer = async () => {
    try {
      const api = window.api;
      if (!api || !api.inventory) {
        toast.error("Admin data viewer is only available in the desktop app.");
        return;
      }

      const products = await dbService.getProducts();
      const nowIso = new Date().toISOString();
      const normalized = products.map((product) => ({
        ...product,
        createdAt: product.createdAt ?? nowIso,
        updatedAt: product.updatedAt ?? nowIso,
      }));

      await api.inventory.syncFromClient(normalized);
      const mirror = await api.inventory.getMirror();
      setAdminMirror(mirror as InventoryItem[]);
      setIsAdminViewerOpen(true);
    } catch (error) {
      console.error("Error loading admin viewer:", error);
      toast.error("Failed to load admin data viewer");
    }
  };

  const handleAdminDelete = async (id: string) => {
    try {
      await dbService.deleteProduct(id);
      await window.api.inventory.delete(id);
      setAdminMirror(prev => prev.filter(item => item.id !== id));
      await handleProductAdded();
    } catch (error) {
      console.error("Error deleting product from admin viewer:", error);
      toast.error("Failed to delete product");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

  const baseData: InventoryItem[] = inventoryData;

  const groupedData: ProductWithBatches[] = useMemo(() => {
    const groups = new Map<string, InventoryItem[]>();

    for (const item of baseData) {
      const key = item.name;
      const existing = groups.get(key) ?? [];
      existing.push(item);
      groups.set(key, existing);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: ProductWithBatches[] = [];

    for (const [, items] of groups) {
      const first = items[0];
      const totalStock = items.reduce((sum, it) => sum + it.stock, 0);
      const minStock = items.reduce((min, it) => (min === null ? it.minStock : Math.min(min, it.minStock)), null as number | null) ?? 0;

      let nearestExpiry = items[0].expiryDate;
      for (const it of items) {
        if (!nearestExpiry) {
          nearestExpiry = it.expiryDate;
          continue;
        }
        if (it.expiryDate && new Date(it.expiryDate) < new Date(nearestExpiry)) {
          nearestExpiry = it.expiryDate;
        }
      }

      const isExpiredGroup = nearestExpiry ? new Date(nearestExpiry) < today : false;
      const isLowStockGroup = totalStock > 0 && totalStock < minStock;

      let status = first.status;
      if (totalStock === 0) {
        status = "Out of Stock";
      } else if (isExpiredGroup) {
        status = "Expired";
      } else if (isLowStockGroup) {
        status = "Low Stock";
      } else {
        status = "In Stock";
      }

      let batchForDisplay = first.batchNo;
      let barcodeForDisplay = first.barcode;
      if (nearestExpiry) {
        const match = items.find((it) => it.expiryDate === nearestExpiry) ?? first;
        batchForDisplay = match.batchNo;
        barcodeForDisplay = match.barcode;
      }

      const batches: BatchInfo[] = items.map((it) => ({
        id: it.id,
        batchNo: it.batchNo,
        expiryDate: it.expiryDate,
        stock: it.stock,
        status: it.status,
        barcode: it.barcode,
      }));

      result.push({
        id: first.id,
        name: first.name,
        price: first.price,
        stock: totalStock,
        minStock,
        category: first.category,
        expiryDate: nearestExpiry,
        status,
        batchNo: batchForDisplay,
        barcode: barcodeForDisplay,
        imageUrl: first.imageUrl,
        batches,
      });
    }

    return result;
  }, [baseData]);

  const categories = getCategories(groupedData);

  // Calculate statistics
  const stats = useMemo(() => {
    const lowStock = groupedData.filter((item) => item.stock > 0 && item.stock <= 10).length;
    const inStock = groupedData.filter((item) => item.status === "In Stock").length;
    const expired = groupedData.filter((item) => item.status === "Expired").length;
    const outOfStock = groupedData.filter((item) => item.status === "Out of Stock").length;
    return { lowStock, inStock, expired, outOfStock };
  }, [groupedData]);

  const hasOutOfStock = useMemo(
    () => groupedData.some((item) => item.status === "Out of Stock"),
    [groupedData]
  );

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...groupedData];

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
  }, [searchTerm, selectedCategory, showLowStockOnly, sortKey, sortDirection, groupedData]);

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

    const printWindow = window.open("", "_blank") as unknown as Window | null;
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
        // Treat "Out of Stock" and any unknown status as neutral/gray.
        return <span className="badge-neutral">{status}</span>;
    }
  };

  const openSpoilageDialog = async () => {
    try {
      const products = await dbService.getProducts();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expired = products.filter((product) => {
        if (!product.expiryDate) return false;
        const expiry = new Date(product.expiryDate);
        return expiry < today && product.status !== "Spoiled";
      });

      if (expired.length === 0) {
        toast.info("No expired products with remaining stock to move to spoilage.");
        return;
      }

      const totalQuantity = expired.reduce((sum, p) => sum + p.stock, 0);
      const totalCost = expired.reduce((sum, p) => sum + (p.cost ?? 0) * p.stock, 0);

      setExpiredProductsForSpoilage(expired);
      setSpoilageSummary({
        products: expired.length,
        totalQuantity,
        totalCost,
      });
      setIsSpoilageDialogOpen(true);
    } catch (error) {
      console.error("Error preparing spoilage move:", error);
      toast.error("Failed to prepare spoilage operation");
    }
  };

  const handleConfirmSpoilageMove = async () => {
    if (expiredProductsForSpoilage.length === 0) {
      setIsSpoilageDialogOpen(false);
      return;
    }

    try {
      setIsProcessingSpoilage(true);
      for (const product of expiredProductsForSpoilage) {
        await dbService.moveProductToSpoilage(product, "Expired");
      }

      await handleProductAdded();
      toast.success("Expired products moved to spoilage with expense records.");
    } catch (error) {
      console.error("Error moving products to spoilage:", error);
      toast.error("Failed to move expired products to spoilage");
    } finally {
      setIsProcessingSpoilage(false);
      setIsSpoilageDialogOpen(false);
      setExpiredProductsForSpoilage([]);
      setSpoilageSummary(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-8 py-6 flex items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
                <p className="text-muted-foreground mt-1">Track and manage your products.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openAdminViewer}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground opacity-0 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-opacity"
              aria-label="Open admin data viewer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isOwner && hasOutOfStock && (
          <div className="mt-4 mb-6 glass-card border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Some products are out of stock.</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                As the store owner, you may want to restock these items to avoid lost sales.
              </p>
            </div>
          </div>
        )}

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

              {stats.expired > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={openSpoilageDialog}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Move Expired to Spoilage</span>
                </Button>
              )}

              <AddProductDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onProductAdded={handleProductAdded}
              />
              <EditProductDialog
                isOpen={isEditDialogOpen}
                product={selectedProduct as unknown as Product}
                onClose={() => setIsEditDialogOpen(false)}
                onProductUpdated={handleProductUpdatedOrDeleted}
                onProductDeleted={handleProductUpdatedOrDeleted}
              />

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
              <button onClick={() => setIsAddDialogOpen(true)} className="glass-button-primary flex items-center gap-2">
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
                    { key: "name", label: "Product" },
                    { key: "price", label: "Price" },
                    { key: "stock", label: "Stock" },
                    { key: "category", label: "Category" },
                    { key: "expiryDate", label: "Expiry" },
                    { key: "status", label: "Status" },
                  ].map((col, idx) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as SortKey)}
                      className={`cursor-pointer hover:bg-muted transition-colors ${idx === 0 ? 'rounded-tl-xl' : ''} ${idx === 5 ? 'rounded-tr-xl' : ''}`}
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
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`${getRowClassName(item)}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td>
                      <button
                        type="button"
                        className="font-medium text-foreground hover:underline text-left"
                        onClick={() => setDetailsProduct(item)}
                      >
                        {item.name}
                      </button>
                    </td>
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
                    <td className="text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          // Use first batch's underlying item id to load full product from DB if needed
                          const batch = item.batches[0];
                          const source = inventory.find((p) => p.id === batch.id) ?? null;
                          setSelectedProduct(source);
                          setIsEditDialogOpen(true);
                        }}
                        aria-label={`Edit ${item.name}`}
                      >
                        <X className="hidden" />
                        <span className="text-xs font-medium">Edit</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          const batch = item.batches[0];
                          const source = inventory.find((p) => p.id === batch.id) ?? null;
                          if (source) {
                            openRowDeleteDialog(source);
                          }
                        }}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        aria-label={`More actions for ${item.name}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {paginatedData.map((item, index) => (
                <div
                  key={item.id}
                  className={`glass-card p-4 flex flex-col ${getRowClassName(item)}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    type="button"
                    className="w-full h-40 bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    onClick={() => setDetailsProduct(item)}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/40" />
                    )}
                  </button>
                  <h3 className="font-bold text-foreground mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-lg text-primary">${item.price.toFixed(2)}</span>
                    <span className={`font-semibold ${isLowStock(item.stock, item.minStock) ? 'text-accent' : 'text-primary'}`}>
                      {item.stock} in stock
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Nearest expiry: {item.expiryDate}</p>
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
      <Dialog open={isAdminViewerOpen} onOpenChange={(open) => setIsAdminViewerOpen(open)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Data Viewer</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto mt-4">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminMirror.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td className="tabular-nums">${item.price.toFixed(2)}</td>
                    <td className="tabular-nums">{item.stock}</td>
                    <td>{item.category}</td>
                    <td className="tabular-nums">{item.expiryDate}</td>
                    <td>{item.status}</td>
                    <td>
                      <button
                        type="button"
                        className="text-destructive text-sm hover:underline"
                        onClick={() => handleAdminDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {adminMirror.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-muted-foreground text-sm">
                      No products in admin viewer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!detailsProduct} onOpenChange={(open) => { if (!open) setDetailsProduct(null); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsProduct?.name}</DialogTitle>
          </DialogHeader>
          {detailsProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="flex items-center justify-center bg-muted rounded-lg min-h-[240px]">
                {detailsProduct.imageUrl ? (
                  <img
                    src={detailsProduct.imageUrl}
                    alt={detailsProduct.name}
                    className="max-h-80 w-full object-contain rounded-lg"
                  />
                ) : (
                  <Package className="w-16 h-16 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{detailsProduct.category}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total stock</p>
                    <p className="font-semibold">{detailsProduct.stock}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nearest expiry</p>
                    <p className="font-semibold">{detailsProduct.expiryDate}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-semibold mb-2">Batches</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Batch No.</th>
                          <th className="px-3 py-2 text-left">Expiry</th>
                          <th className="px-3 py-2 text-right">Stock</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Barcode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsProduct.batches.map((batch) => (
                          <tr key={batch.id} className="border-t">
                            <td className="px-3 py-2 font-mono text-xs">{batch.batchNo}</td>
                            <td className="px-3 py-2 text-xs">{batch.expiryDate}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{batch.stock}</td>
                            <td className="px-3 py-2 text-xs">{batch.status}</td>
                            <td className="px-3 py-2 font-mono text-xs">{batch.barcode}</td>
                          </tr>
                        ))}
                        {detailsProduct.batches.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-xs">
                              No batch information available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isRowDeleteOpen} onOpenChange={(open) => setIsRowDeleteOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. To confirm, type
              {" "}
              <span className="font-mono font-semibold">
                #{rowToDelete?.name ?? "ProductName"}
              </span>
              {" "}
              below.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="glass-input w-full"
              placeholder={`#${rowToDelete?.name ?? "ProductName"}`}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRowDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRowDelete}
              disabled={!rowToDelete || deleteConfirmText !== `#${rowToDelete.name}`}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
