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

  // For now, use sample inventory data (can be enhanced later with category breakdown from database)
  const inventoryData = [
    { category: "Electronics", value: 45 },
    { category: "Food", value: 30 },
    { category: "Clothing", value: 15 },
    { category: "Other", value: 10 },
  ];

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
            <Card className="border-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        fill="#133020"
                        dataKey="value"
                        label={false}
                      >
                        {inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                    {inventoryData.map((item, index) => (
                      <div key={item.category} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.category}: <span className="font-semibold text-foreground">{item.value}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="border-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sales by Region</CardTitle>
                <p className="text-sm text-muted-foreground">Top performing regions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded overflow-hidden bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold">US</span>
                      </div>
                      <span className="font-medium">United States</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(12584)}</p>
                      <p className="text-xs text-muted-foreground">+18%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded overflow-hidden bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold">UK</span>
                      </div>
                      <span className="font-medium">United Kingdom</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(8942)}</p>
                      <p className="text-xs text-muted-foreground">+12%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded overflow-hidden bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold">CA</span>
                      </div>
                      <span className="font-medium">Canada</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(6731)}</p>
                      <p className="text-xs text-muted-foreground">+9%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 rounded overflow-hidden bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold">AU</span>
                      </div>
                      <span className="font-medium">Australia</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(5289)}</p>
                      <p className="text-xs text-muted-foreground">+7%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </>
  );
};

export default Dashboard;
