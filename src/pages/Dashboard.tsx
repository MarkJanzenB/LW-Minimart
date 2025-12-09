import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users, LayoutDashboard, ArrowRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useLocation } from "react-router-dom";
import { formatCurrency, useCurrency } from "@/hooks/use-currency";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCashflow = location.pathname === "/cashflow";
  const { currency } = useCurrency();
  const [metrics, setMetrics] = useState<any>(null);
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

  // Fetch dashboard metrics from database
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Transform database data for charts
  const salesData = metrics?.recentTransactions?.map((t: any, index: number) => ({
    month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
    sales: t.revenue || 0,
  })) || [
    { month: "Jan", sales: 0 },
    { month: "Feb", sales: 0 },
    { month: "Mar", sales: 0 },
    { month: "Apr", sales: 0 },
    { month: "May", sales: 0 },
    { month: "Jun", sales: 0 },
  ];

  // Inventory category breakdown - can be enhanced later with database query
  // For now, show empty state if no data
  const inventoryData = metrics?.inventory?.totalProducts > 0 ? [
    // This would be populated from a database query for category breakdown
    // Placeholder structure - will be replaced with real data when query is added
  ] : [];

  const COLORS = ["#133020", "#FFB347", "#FFC370", "#133020"];

  // Transform recent transactions to revenue data format
  const revenueData = metrics?.recentTransactions?.map((t: any) => ({
    day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
    income: t.revenue || 0,
    expenses: 0, // Expenses would need separate tracking
    profit: t.revenue || 0,
  })) || [
    { day: "Mon", income: 0, expenses: 0, profit: 0 },
    { day: "Tue", income: 0, expenses: 0, profit: 0 },
    { day: "Wed", income: 0, expenses: 0, profit: 0 },
    { day: "Thu", income: 0, expenses: 0, profit: 0 },
    { day: "Fri", income: 0, expenses: 0, profit: 0 },
    { day: "Sat", income: 0, expenses: 0, profit: 0 },
    { day: "Sun", income: 0, expenses: 0, profit: 0 },
  ];

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

            {/* Customers Card */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Active Customers</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">432</h3>
                    <div className="flex items-center mt-2 text-primary">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">+15.3% from last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Sales Trend Chart */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sales Index</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly sales performance</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Bar dataKey="sales" fill="#133020" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cash Flow Chart - Income, Expenses & Profit */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Cash Flow Trends (7 Days)</CardTitle>
                <p className="text-sm text-muted-foreground">Daily income and expenses overview</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={revenueData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#133020" 
                      strokeWidth={3}
                      dot={{ fill: "#133020", r: 6, strokeWidth: 0 }}
                      activeDot={{ r: 8, fill: "#133020" }}
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="hsl(0, 84%, 60%)" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(0, 84%, 60%)", r: 6, strokeWidth: 0 }}
                      activeDot={{ r: 8, fill: "hsl(0, 84%, 60%)" }}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#FFB347" 
                      strokeWidth={3}
                      dot={{ fill: "#FFB347", r: 6, strokeWidth: 0 }}
                      activeDot={{ r: 8, fill: "#FFB347" }}
                      name="Profit"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
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
