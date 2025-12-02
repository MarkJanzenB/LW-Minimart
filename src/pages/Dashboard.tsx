import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  // Sample data for charts
  const salesData = [
    { month: "Jan", sales: 4000 },
    { month: "Feb", sales: 3000 },
    { month: "Mar", sales: 5000 },
    { month: "Apr", sales: 4500 },
    { month: "May", sales: 6000 },
    { month: "Jun", sales: 5500 },
  ];

  const inventoryData = [
    { category: "Electronics", value: 45 },
    { category: "Food", value: 30 },
    { category: "Clothing", value: 15 },
    { category: "Other", value: 10 },
  ];

  const COLORS = ["hsl(160, 84%, 39%)", "hsl(160, 70%, 50%)", "hsl(160, 50%, 60%)", "hsl(160, 30%, 70%)"];

  const revenueData = [
    { day: "Mon", revenue: 2400 },
    { day: "Tue", revenue: 1398 },
    { day: "Wed", revenue: 9800 },
    { day: "Thu", revenue: 3908 },
    { day: "Fri", revenue: 4800 },
    { day: "Sat", revenue: 3800 },
    { day: "Sun", revenue: 4300 },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Header Section */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-8 py-6 flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your store performance</p>
              </div>
            </div>
          </div>

        <div className="p-8 space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">3,605 <span className="text-lg">USD/m</span></h3>
                    <div className="flex items-center mt-2 text-primary">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">+12.5% from last month</span>
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
                    <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">1,254</h3>
                    <div className="flex items-center mt-2 text-primary">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">+8.2% from last week</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Products in Stock</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">856</h3>
                    <div className="flex items-center mt-2 text-destructive">
                      <TrendingDown className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">-3.1% from last month</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend Chart */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Weekly revenue tracking</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
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
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 5 }}
                    />
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
                        fill="#8884d8"
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
                      <p className="font-semibold">$12,584</p>
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
                      <p className="font-semibold">$8,942</p>
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
                      <p className="font-semibold">$6,731</p>
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
                      <p className="font-semibold">$5,289</p>
                      <p className="text-xs text-muted-foreground">+7%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
