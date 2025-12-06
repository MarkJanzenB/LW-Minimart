import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertTriangle, Clock, DollarSign, Layers, Download, Calendar, FileText } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/hooks/use-currency";

const Reports = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2025, 0, 1),
    to: new Date(2025, 0, 31),
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<"previous" | "year-ago">("previous");

  // Profit per product category data
  const categoryProfitData = [
    { category: "Snacks & Chips", revenue: 12500, cost: 7800, profit: 4700, margin: 37.6, prevRevenue: 11200, prevProfit: 4100 },
    { category: "Beverages", revenue: 18200, cost: 11400, profit: 6800, margin: 37.4, prevRevenue: 16800, prevProfit: 6200 },
    { category: "Dairy & Eggs", revenue: 9800, cost: 7200, profit: 2600, margin: 26.5, prevRevenue: 10200, prevProfit: 2800 },
    { category: "Personal Care", revenue: 8400, cost: 5100, profit: 3300, margin: 39.3, prevRevenue: 7800, prevProfit: 3000 },
    { category: "Household Items", revenue: 6200, cost: 3900, profit: 2300, margin: 37.1, prevRevenue: 6000, prevProfit: 2200 },
    { category: "Frozen Foods", revenue: 5600, cost: 3800, profit: 1800, margin: 32.1, prevRevenue: 5400, prevProfit: 1700 },
  ];

  // Fast-moving vs slow-moving items
  const inventoryTurnoverData = [
    { product: "Coca-Cola 500ml", sold: 450, stock: 120, turnover: 3.75, status: "fast", daysToStockout: 3 },
    { product: "Lay's Chips", sold: 380, stock: 95, turnover: 4.0, status: "fast", daysToStockout: 2 },
    { product: "Instant Noodles", sold: 340, stock: 180, turnover: 1.89, status: "fast", daysToStockout: 5 },
    { product: "Milk 1L", sold: 280, stock: 85, turnover: 3.29, status: "fast", daysToStockout: 3 },
    { product: "Bread Loaf", sold: 250, stock: 60, turnover: 4.17, status: "fast", daysToStockout: 2 },
    { product: "Energy Drinks", sold: 120, stock: 180, turnover: 0.67, status: "medium", daysToStockout: 15 },
    { product: "Canned Goods", sold: 65, stock: 240, turnover: 0.27, status: "slow", daysToStockout: 37 },
    { product: "Gourmet Snacks", sold: 45, stock: 190, turnover: 0.24, status: "slow", daysToStockout: 42 },
  ];

  // Inventory shortage impact on sales
  const shortageImpactData = [
    { week: "Week 1", potentialSales: 8500, actualSales: 8500, lostSales: 0, prevPotentialSales: 8200, prevActualSales: 8200 },
    { week: "Week 2", potentialSales: 9200, actualSales: 7800, lostSales: 1400, prevPotentialSales: 8900, prevActualSales: 7500 },
    { week: "Week 3", potentialSales: 8900, actualSales: 6500, lostSales: 2400, prevPotentialSales: 8600, prevActualSales: 6800 },
    { week: "Week 4", potentialSales: 9500, actualSales: 9500, lostSales: 0, prevPotentialSales: 9200, prevActualSales: 9200 },
  ];

  // Stock prediction data
  const stockPredictionData = [
    { day: "Day 1", current: 120, predicted: 120 },
    { day: "Day 2", current: null, predicted: 96 },
    { day: "Day 3", current: null, predicted: 72 },
    { day: "Day 4", current: null, predicted: 48 },
    { day: "Day 5", current: null, predicted: 24 },
    { day: "Day 6", current: null, predicted: 12 },
    { day: "Day 7", current: null, predicted: 0 },
  ];

  const COLORS = {
    fast: "#133020",
    medium: "#FFB347",
    slow: "#FFC370",
  };

  const handleExportPDF = () => {
    // In a real application, you would use a library like jsPDF
    alert("Export to PDF functionality - This would generate a PDF report with all the data");
  };

  const handleExportExcel = () => {
    // In a real application, you would use a library like xlsx
    alert("Export to Excel functionality - This would generate an Excel file with all the data");
  };

  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <FileText className="w-5 h-5 text-foreground" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Advanced Reports & Analytics</h1>
              <p className="text-muted-foreground mt-1">Deep insights into profitability, inventory performance, and predictive analytics</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from && dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Select Date Range</p>
                        <div className="flex gap-2">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                            className="pointer-events-auto"
                          />
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                            className="pointer-events-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 max-w-7xl mx-auto">
          {/* Period Comparison Toggle */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Period Comparison</h3>
                  <p className="text-sm text-muted-foreground mt-1">Compare current period with previous periods</p>
                </div>
                <Tabs value={comparisonPeriod} onValueChange={(value) => setComparisonPeriod(value as "previous" | "year-ago")}>
                  <TabsList>
                    <TabsTrigger value="previous">vs Previous Period</TabsTrigger>
                    <TabsTrigger value="year-ago">vs Year Ago</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Section 1: Profit per Product Category with Comparison */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Profit by Product Category</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comparison Bar Chart */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Current vs Previous Period</CardTitle>
                  <p className="text-sm text-muted-foreground">Profit comparison across categories</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryProfitData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="category" 
                        stroke="hsl(var(--muted-foreground))" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={11}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="profit" fill="#133020" name="Current Period" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="prevProfit" fill="#FFB347" name="Previous Period" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Profit Cards with Growth */}
              <div className="space-y-4">
                {categoryProfitData.slice(0, 4).map((item) => {
                  const growth = ((item.profit - item.prevProfit) / item.prevProfit * 100).toFixed(1);
                  const isPositive = parseFloat(growth) > 0;
                  return (
                    <Card key={item.category} className="border hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{item.category}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={item.margin > 35 ? "default" : "secondary"}>
                                {item.margin}% margin
                              </Badge>
                              <Badge variant={isPositive ? "default" : "destructive"} className="flex items-center gap-1">
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {growth}%
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Current</p>
                              <p className="font-bold text-primary">{formatCurrency(item.profit)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Previous</p>
                              <p className="font-bold text-foreground">{formatCurrency(item.prevProfit)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Difference</p>
                              <p className={cn("font-bold", isPositive ? "text-primary" : "text-destructive")}>
                                {isPositive ? "+" : ""}{formatCurrency(item.profit - item.prevProfit)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Fast-Moving vs Slow-Moving Items */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Inventory Turnover Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fast-Moving Items */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Fast-Moving Items
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">High turnover rate ({">"} 3x/month)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryTurnoverData.filter(item => item.status === "fast").map((item) => (
                      <div key={item.product} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-foreground text-sm">{item.product}</p>
                          <Badge variant="default" className="text-xs">
                            {item.turnover.toFixed(1)}x
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sold: {item.sold}/mo</span>
                          <span className="text-muted-foreground">Stock: {item.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medium-Moving Items */}
              <Card className="border-2 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-accent" />
                    Medium-Moving Items
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Moderate turnover (0.5-3x/month)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryTurnoverData.filter(item => item.status === "medium").map((item) => (
                      <div key={item.product} className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-foreground text-sm">{item.product}</p>
                          <Badge variant="secondary" className="text-xs">
                            {item.turnover.toFixed(1)}x
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sold: {item.sold}/mo</span>
                          <span className="text-muted-foreground">Stock: {item.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Slow-Moving Items */}
              <Card className="border-2 border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                    Slow-Moving Items
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Low turnover ({"<"} 0.5x/month)</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryTurnoverData.filter(item => item.status === "slow").map((item) => (
                      <div key={item.product} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-foreground text-sm">{item.product}</p>
                          <Badge variant="destructive" className="text-xs">
                            {item.turnover.toFixed(2)}x
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sold: {item.sold}/mo</span>
                          <span className="text-muted-foreground">Stock: {item.stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 3: Inventory Shortage Impact with Comparison */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold text-foreground">Inventory Shortage Impact on Sales</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Impact Chart with Comparison */}
              <Card className="border-2 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Potential vs Actual Sales (Current vs Previous)</CardTitle>
                  <p className="text-sm text-muted-foreground">Revenue lost due to inventory shortages - comparison view</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={shortageImpactData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actualSales" 
                        stroke="#133020" 
                        strokeWidth={3} 
                        name="Current Actual"
                        dot={{ fill: "#133020", r: 6, strokeWidth: 0 }}
                        activeDot={{ r: 8, fill: "#133020" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="prevActualSales" 
                        stroke="#FFB347" 
                        strokeWidth={3} 
                        strokeDasharray="5 5" 
                        name="Previous Actual"
                        dot={{ fill: "#FFB347", r: 6, strokeWidth: 0 }}
                        activeDot={{ r: 8, fill: "#FFB347" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lostSales" 
                        stroke="#FFC370" 
                        strokeWidth={3} 
                        name="Lost Revenue"
                        dot={{ fill: "#FFC370", r: 6, strokeWidth: 0 }}
                        activeDot={{ r: 8, fill: "#FFC370" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Impact Summary */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Lost Sales</span>
                        <span className="font-bold text-destructive text-lg">{formatCurrency(3800)}</span>
                      </div>
                      <Progress value={10.2} className="h-2" />
                      <p className="text-xs text-muted-foreground">10.2% of potential revenue</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      <h4 className="font-semibold text-sm text-foreground">Top Shortage Items:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Coca-Cola 500ml</span>
                          <span className="font-semibold text-destructive">-{formatCurrency(840)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Lay's Chips</span>
                          <span className="font-semibold text-destructive">-{formatCurrency(620)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Instant Noodles</span>
                          <span className="font-semibold text-destructive">-{formatCurrency(580)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-xs text-destructive font-medium">
                          ⚠ Week 3 showed highest impact - implement auto-reorder for critical items
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section 4: Stock Prediction */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Predictive Stock Analysis</h2>
            </div>

            <div className="flex justify-center">
              {/* Prediction Chart - Centered */}
              <Card className="border-2 w-full max-w-4xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Stock Depletion Forecast</CardTitle>
                  <p className="text-sm text-muted-foreground">AI-powered prediction for Coca-Cola 500ml</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stockPredictionData}>
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
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="current" 
                        stroke="#133020" 
                        strokeWidth={3}
                        dot={{ fill: "#133020", r: 6, strokeWidth: 0 }}
                        activeDot={{ r: 8, fill: "#133020" }}
                        name="Current Stock"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#FFB347" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ fill: "#FFB347", r: 6, strokeWidth: 0 }}
                        activeDot={{ r: 8, fill: "#FFB347" }}
                        name="Predicted Stock"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </>
  );
};

export default Reports;
