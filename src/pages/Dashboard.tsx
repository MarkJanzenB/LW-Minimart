import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, LayoutDashboard, ArrowRight, AlertTriangle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart, ComposedChart } from "recharts";
import { useLocation } from "react-router-dom";
import { formatCurrency, useCurrency } from "@/hooks/use-currency";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCashflow = location.pathname === "/cashflow";
  const { currency } = useCurrency();
  const [metrics, setMetrics] = useState<any>(null);
  const [spoilageData, setSpoilageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleProductsClick = () => {
    navigate("/inventory");
  };

  const handlePosClick = () => {
    navigate("/pos");
  };

  const handleSalesHistoryClick = () => {
    navigate("/history/sales");
  };

  const handleRestockHistoryClick = () => {
    navigate("/history/restock");
  };

  const handleReportsClick = () => {
    navigate("/reports");
  };

  // Fetch dashboard metrics and spoilage data from database with real-time updates
  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchMetrics = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        
        // Fetch dashboard metrics
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data) {
          setMetrics(response.data);
        }
        
        // Fetch spoilage data to calculate expenses
        const spoilageResponse = await (window as any).api.spoilage.getAll();
        if (spoilageResponse.success && Array.isArray(spoilageResponse.data)) {
          setSpoilageData(spoilageResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // Fetch immediately on mount
    fetchMetrics();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(fetchMetrics, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Transform sales performance data for line chart
  const salesPerformanceData = metrics?.salesPerformance?.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: parseFloat(t.sales || t.revenue || 0),
    revenue: parseFloat(t.revenue || t.sales || 0),
  })) || [];

  // Transform top products data for horizontal bar chart
  const topProductsData = (metrics?.topProducts || []).slice(0, 5).map((product: any) => ({
    name: product.name || 'Unknown',
    sales: parseFloat(product.total_sales || 0),
    quantity: parseInt(product.quantity_sold || 0),
    revenue: parseFloat(product.total_sales || 0),
  })).reverse(); // Reverse for horizontal bar (top to bottom)

  // Inventory category breakdown - can be enhanced later with database query
  // For now, show empty state if no data
  const inventoryData = metrics?.inventory?.totalProducts > 0 ? [
    // This would be populated from a database query for category breakdown
    // Placeholder structure - will be replaced with real data when query is added
  ] : [];

  const COLORS = ["#133020", "#FFB347", "#FFC370", "#133020"];

  // Calculate daily spoilage expenses from spoilage records
  const calculateDailySpoilageExpenses = () => {
    const spoilageByDate = new Map<string, number>();
    
    spoilageData.forEach((record: any) => {
      if (record.spoiledAt) {
        const date = new Date(record.spoiledAt).toISOString().split('T')[0];
        const totalCost = parseFloat(record.totalCost || 0);
        const existing = spoilageByDate.get(date) || 0;
        spoilageByDate.set(date, existing + totalCost);
      }
    });
    
    return spoilageByDate;
  };

  // Transform recent transactions to revenue data format, including spoilage expenses
  const revenueData = (() => {
    const spoilageExpenses = calculateDailySpoilageExpenses();
    
    return (metrics?.recentTransactions || []).map((t: any) => {
      const transactionDate = new Date(t.date).toISOString().split('T')[0];
      const spoilageCost = spoilageExpenses.get(transactionDate) || 0;
      const income = parseFloat(t.revenue || 0);
      const expenses = spoilageCost;
      const profit = income - expenses;
      
      return {
        day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
        income,
        expenses,
        profit,
      };
    });
  })();

  const recentActivity = (metrics?.recentTransactions || []).slice(-5).reverse();

  return (
        <>
          {/* Header Section */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-8 py-6 flex items-center gap-4">
              <SidebarTrigger />
              {isCashflow ? (
                <DollarSign className="w-5 h-5 text-foreground" />
              ) : (
                <LayoutDashboard className="w-5 h-5 text-foreground" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-foreground">{isCashflow ? "Cashflow" : "Dashboard"}</h1>
                <p className="text-muted-foreground mt-1">{isCashflow ? "Financial overview and cash flow tracking" : "Overview of your store"}</p>
              </div>
            </div>
          </div>

        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">
                      {loading ? '...' : formatCurrency(metrics?.revenue?.total || 0)}
                    </h3>
                    <div className="flex items-center mt-2 text-primary">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        Today: {formatCurrency(metrics?.revenue?.today || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Card */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Transactions</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">
                      {loading ? '...' : (metrics?.revenue?.transactions || 0).toLocaleString()}
                    </h3>
                    <div className="flex items-center mt-2 text-primary">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        Today: {metrics?.revenue?.todayTransactions || 0}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card 
              className="border-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              onClick={handleProductsClick}
            >
              <CardContent className="pt-6 relative">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Products in Stock</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">
                      {loading ? '...' : (metrics?.inventory?.totalStock || 0).toLocaleString()}
                    </h3>
                    <div className="flex items-center mt-2 text-destructive">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {metrics?.inventory?.lowStockCount || 0} low stock items
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expired Stocks Card */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 shadow-lg border-amber-300/50 dark:border-amber-800/50 bg-gradient-to-br from-card via-amber-50/20 dark:via-amber-950/20 to-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium mb-1.5 tracking-wide">Expired Stocks</p>
                    <h3 className="text-3xl font-bold mt-2 mb-1 text-amber-600 dark:text-amber-500 leading-tight">
                      {loading ? '...' : (metrics?.inventory?.expiredProductsCount || 0).toLocaleString()}
                    </h3>
                    <div className="flex items-center mt-3 gap-1.5">
                      {metrics?.inventory?.expiredComparisonPercent !== undefined && !loading ? (
                        <>
                          {metrics.inventory.expiredComparisonPercent >= 0 ? (
                            <TrendingUp className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-500" />
                          )}
                          <span className={`text-sm font-semibold ${
                            metrics.inventory.expiredComparisonPercent >= 0 
                              ? 'text-red-600 dark:text-red-500' 
                              : 'text-green-600 dark:text-green-500'
                          }`}>
                            {metrics.inventory.expiredComparisonPercent >= 0 ? '+' : ''}
                            {Math.abs(metrics.inventory.expiredComparisonPercent).toFixed(1)}% from last month
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-amber-600/80 dark:text-amber-500/80">
                          {metrics?.inventory?.expiredStockQuantity || 0} units expired
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-500/15 to-red-500/20 dark:from-amber-500/30 dark:via-amber-500/25 dark:to-red-500/30 flex items-center justify-center shadow-md border border-amber-300/40 dark:border-amber-700/40 flex-shrink-0">
                    <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-500" strokeWidth={2.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Sales Performance Over Time - Line Chart with Gradient */}
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sales Performance Over Time</CardTitle>
                <p className="text-sm text-muted-foreground">Daily revenue trends (Last 30 days)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={salesPerformanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#133020" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#133020" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#133020" 
                      strokeWidth={2.5}
                      fill="url(#salesGradient)"
                      dot={{ fill: "#133020", r: 4, strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#133020", strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {salesPerformanceData.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Sales (30 days)</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(salesPerformanceData.reduce((sum: number, item: any) => sum + (item.sales || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 5 Best-Selling Products - Horizontal Bar Chart */}
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top 5 Best-Selling Products</CardTitle>
                <p className="text-sm text-muted-foreground">Revenue contribution by product</p>
              </CardHeader>
              <CardContent>
                {topProductsData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart 
                        data={topProductsData} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
                        <XAxis 
                          type="number" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          width={90}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === 'sales' || name === 'revenue') return formatCurrency(value);
                            return value;
                          }}
                          labelFormatter={(label) => `Product: ${label}`}
                        />
                        <Bar 
                          dataKey="sales" 
                          fill="#133020" 
                          radius={[0, 8, 8, 0]}
                          name="Revenue"
                        >
                          {topProductsData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill="#133020" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Revenue</span>
                          <p className="font-semibold text-foreground mt-1">
                            {formatCurrency(topProductsData.reduce((sum: number, item: any) => sum + (item.sales || 0), 0))}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Units Sold</span>
                          <p className="font-semibold text-foreground mt-1">
                            {topProductsData.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No sales data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Distribution */}
            <Card className="border-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={handlePosClick}
                    className="w-full rounded-lg border border-border bg-card px-3 py-4 text-left hover:bg-muted transition-colors flex flex-col gap-2"
                  >
                    <span className="text-xs text-muted-foreground">Sell</span>
                    <span className="text-sm font-semibold">Open POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProductsClick}
                    className="w-full rounded-lg border border-border bg-card px-3 py-4 text-left hover:bg-muted transition-colors flex flex-col gap-2"
                  >
                    <span className="text-xs text-muted-foreground">Stock</span>
                    <span className="text-sm font-semibold">Manage Inventory</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestockHistoryClick}
                    className="w-full rounded-lg border border-border bg-card px-3 py-4 text-left hover:bg-muted transition-colors flex flex-col gap-2"
                  >
                    <span className="text-xs text-muted-foreground">Purchasing</span>
                    <span className="text-sm font-semibold">Restock History</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReportsClick}
                    className="w-full rounded-lg border border-border bg-card px-3 py-4 text-left hover:bg-muted transition-colors flex flex-col gap-2"
                  >
                    <span className="text-xs text-muted-foreground">Insights</span>
                    <span className="text-sm font-semibold">View Reports</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="border-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Store Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Checking for alerts...</p>
                ) : (
                  <div className="space-y-3">
                    {(metrics?.inventory?.lowStockCount || 0) > 0 && (
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/40">
                        <div>
                          <p className="text-sm font-semibold text-destructive">Low / almost out-of-stock products</p>
                          <p className="text-xs text-muted-foreground">
                            {metrics.inventory.lowStockCount.toLocaleString()} items are at or below their reorder level.
                          </p>
                        </div>
                      </div>
                    )}

                    {(metrics?.inventory?.expiringSoonCount || 0) > 0 && (
                      <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-accent/10 border border-accent/40">
                        <div>
                          <p className="text-sm font-semibold text-accent">Products nearing expiry</p>
                          <p className="text-xs text-muted-foreground">
                            {metrics.inventory.expiringSoonCount.toLocaleString()} products expire within the next 7 days.
                          </p>
                        </div>
                      </div>
                    )}

                    {(metrics?.inventory?.lowStockCount || 0) === 0 && (metrics?.inventory?.expiringSoonCount || 0) === 0 && (
                      <p className="text-sm text-muted-foreground">No critical inventory alerts right now.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </>
  );
};

export default Dashboard;
