import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, Filter, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Sample product data - replace with your actual data source
const products = [
  { id: 1, name: "Wireless Earbuds", sku: "WB-001", category: "Electronics", price: 99.99, stock: 45, minStock: 10, status: "In Stock" },
  { id: 2, name: "Smart Watch", sku: "SW-002", category: "Electronics", price: 199.99, stock: 5, minStock: 12, status: "Low Stock" },
  { id: 3, name: "Bluetooth Speaker", sku: "BS-003", category: "Electronics", price: 79.99, stock: 2, minStock: 8, status: "Low Stock" },
  { id: 4, name: "Gaming Mouse", sku: "GM-004", category: "Electronics", price: 49.99, stock: 24, minStock: 15, status: "In Stock" },
  { id: 5, name: "Mechanical Keyboard", sku: "MK-005", category: "Electronics", price: 89.99, stock: 0, minStock: 10, status: "Out of Stock" },
  { id: 6, name: "USB-C Cable", sku: "UC-006", category: "Accessories", price: 12.99, stock: 45, minStock: 20, status: "In Stock" },
  { id: 7, name: "Laptop Stand", sku: "LS-007", category: "Accessories", price: 29.99, stock: 8, minStock: 5, status: "In Stock" },
  { id: 8, name: "Wireless Charger", sku: "WC-008", category: "Electronics", price: 34.99, stock: 0, minStock: 10, status: "Out of Stock" },
];

function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || !price || !stock) {
      toast({
        title: "Missing information",
        description: "Please fill in all product fields before saving.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Product added",
      description: `${name} has been added to your catalog (local only).`,
    });

    setName("");
    setSku("");
    setPrice("");
    setStock("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 text-primary-foreground hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>Quickly add a new item to your inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Earbuds"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. WB-001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                required
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product-stock">Stock</Label>
              <Input
                id="product-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="45"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-min-stock">Min stock (optional)</Label>
              <Input
                id="product-min-stock"
                type="number"
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  const { toast } = useToast();

  const totalProducts = products.length;
  const inStockItems = products.filter((p) => p.status === "In Stock");
  const lowStockItems = products.filter((p) => p.status === "Low Stock");
  const outOfStockItems = products.filter((p) => p.status === "Out of Stock");
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const inStockUnits = inStockItems.reduce((sum, p) => sum + p.stock, 0);
  const lowStockUnits = lowStockItems.reduce((sum, p) => sum + p.stock, 0);
  const lowStockMinRequired = lowStockItems.reduce((sum, p) => sum + p.minStock, 0);
  const outOfStockMinRequired = outOfStockItems.reduce((sum, p) => sum + p.minStock, 0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  const handleStatusToggle = (status: string, checked: boolean) => {
    setStatusFilters((prev) => {
      if (checked) {
        if (prev.includes(status)) return prev;
        return [...prev, status];
      }
      return prev.filter((s) => s !== status);
    });
  };

  const search = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search);

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(p.status);

    return matchesSearch && matchesStatus;
  });

  const handleViewLowStockItems = () => {
    setSearchTerm("");
    setStatusFilters(["Low Stock"]);
  };

  const handleExport = () => {
    const headers = ["Name", "SKU", "Category", "Price", "Stock", "Min Stock", "Status"];
    const rows = products.map((p) => [
      p.name,
      p.sku,
      p.category,
      p.price.toFixed(2),
      p.stock.toString(),
      p.minStock.toString(),
      p.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export started",
      description: `Downloaded ${products.length} products as CSV.`,
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Stock</h2>
          <p className="text-muted-foreground">Summary of all products currently in your inventory.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <AddProductDialog />
        </div>
      </div>

      {/* Summary Cards (production stock summary) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total unique items in catalog</p>
            <div className="mt-2 text-xs text-muted-foreground opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <p>Total units in stock: {totalUnits}</p>
              <p>
                {inStockItems.length} in stock | {lowStockItems.length} low stock | {outOfStockItems.length} out of stock
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100 bg-emerald-50/60 dark:bg-emerald-950/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Ready to sell</p>
            <div className="mt-2 text-xs text-muted-foreground opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <p>Total units available: {inStockUnits}</p>
              <p>Average stock per item: {inStockItems.length ? Math.round(inStockUnits / inStockItems.length) : 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-100 bg-yellow-50/60 dark:bg-yellow-950/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Needs restocking soon</p>
            <div className="mt-2 text-xs text-muted-foreground opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <p>Units remaining: {lowStockUnits}</p>
              <p>
                Target minimum units: {lowStockMinRequired}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 bg-red-50/60 dark:bg-red-950/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <div className="h-3 w-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Critical – reorder now</p>
            <div className="mt-2 text-xs text-muted-foreground opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              <p>Items out of stock: {outOfStockItems.length}</p>
              <p>Units needed to reach minimums: {outOfStockMinRequired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-3">
              <p className="text-sm font-medium">Filter by status</p>
              <div className="space-y-2">
                {["In Stock", "Low Stock", "Out of Stock"].map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={statusFilters.includes(status)}
                      onCheckedChange={(checked) =>
                        handleStatusToggle(status, checked === true)
                      }
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setStatusFilters([])}
              >
                Clear filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.stock}
                      {product.status === "Low Stock" && (
                        <Badge variant="destructive" className="h-5 text-xs">
                          Min: {product.minStock}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "In Stock"
                          ? "default"
                          : product.status === "Low Stock"
                          ? "secondary"
                          : "destructive"
                      }
                      className="capitalize"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 opacity-0 group-hover:opacity-100"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {lowStockItems.length} {lowStockItems.length === 1 ? "item is" : "items are"} running low in stock
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Consider restocking these items soon to avoid running out of inventory.</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                  onClick={handleViewLowStockItems}
                >
                  View Low Stock Items
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
