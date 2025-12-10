import { useState, useEffect } from "react";
import { CashflowChart } from "@/components/CashflowChart";
import { CashFlowTrendChart } from "@/components/CashFlowTrendChart";
import { CashBalanceCard } from "@/components/CashBalanceCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionList } from "@/components/TransactionList";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { CashFlowForecast } from "@/components/CashFlowForecast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus, FileText, Bell, TrendingUp, DollarSign, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatCurrency } from "@/hooks/use-currency";

const Cashflow = () => {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [spoilageData, setSpoilageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard metrics and spoilage data for income/expenses with real-time updates
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
        console.error('Failed to fetch cashflow metrics:', error);
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

  // Transform income vs expenses data, including spoilage expenses
  const incomeExpensesData = (() => {
    const spoilageExpenses = calculateDailySpoilageExpenses();
    const baseData = (metrics?.incomeExpenses || []).map((item: any) => {
      const date = new Date(item.date).toISOString().split('T')[0];
      const spoilageCost = spoilageExpenses.get(date) || 0;
      const existingExpenses = parseFloat(item.expenses || 0);
      const totalExpenses = existingExpenses + spoilageCost;
      
      return {
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateKey: date,
        income: parseFloat(item.income || 0),
        expenses: totalExpenses,
        net: parseFloat(item.income || 0) - totalExpenses,
      };
    });
    
    // Add dates that have spoilage but no existing income/expense data
    spoilageExpenses.forEach((spoilageCost, date) => {
      const exists = baseData.some((item: any) => item.dateKey === date);
      if (!exists) {
        baseData.push({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateKey: date,
          income: 0,
          expenses: spoilageCost,
          net: -spoilageCost,
        });
      }
    });
    
    // Sort by date and remove dateKey
    return baseData
      .sort((a: any, b: any) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime())
      .map(({ dateKey, ...rest }: any) => rest);
  })();

  // Transform expense categories data for donut chart, including spoilage
  const expenseCategoriesData = (() => {
    const categories = new Map<string, { value: number; count: number }>();
    
    // Add existing expense categories
    (metrics?.expenseCategories || []).forEach((item: any) => {
      const category = item.category || 'Uncategorized';
      categories.set(category, {
        value: parseFloat(item.total_amount || 0),
        count: parseInt(item.count || 0),
      });
    });
    
    // Add spoilage expenses
    const totalSpoilageCost = spoilageData.reduce((sum: number, record: any) => {
      return sum + parseFloat(record.totalCost || 0);
    }, 0);
    
    if (totalSpoilageCost > 0) {
      const existing = categories.get('Spoilage');
      if (existing) {
        existing.value += totalSpoilageCost;
        existing.count += spoilageData.length;
      } else {
        categories.set('Spoilage', {
          value: totalSpoilageCost,
          count: spoilageData.length,
        });
      }
    }
    
    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
    }));
  })();

  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
  };

  const handleExport = () => {
    // Export functionality would go here
    console.log("Exporting cash flow data...");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Cash Flow</h1>
          <p className="text-muted-foreground">Track your cash inflows, outflows, and balance</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 p-4 bg-card border rounded-lg">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <DateRangeFilter onDateChange={handleDateChange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Balance Card */}
          <CashBalanceCard />
          
          {/* Cash Flow Health Card */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Cash Flow Health</CardTitle>
              <p className="text-sm text-muted-foreground">Your financial stability indicator</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (() => {
                const monthlyChange = metrics?.revenue?.monthlyChangePercent || 0;
                const isPositive = monthlyChange >= 0;
                const isGood = monthlyChange >= 5; // Consider 5%+ as "Good"
                const isPoor = monthlyChange <= -10; // Consider -10% or worse as "Poor"
                
                let status = "Fair";
                let statusColor = "text-blue-600 dark:text-blue-500";
                let bgColor = "bg-blue-100 dark:bg-blue-900/30";
                let iconColor = "text-blue-600";
                let Icon = TrendingUp;
                
                if (isGood) {
                  status = "Good";
                  statusColor = "text-green-600 dark:text-green-500";
                  bgColor = "bg-green-100 dark:bg-green-900/30";
                  iconColor = "text-green-600";
                  Icon = TrendingUp;
                } else if (isPoor) {
                  status = "Poor";
                  statusColor = "text-red-600 dark:text-red-500";
                  bgColor = "bg-red-100 dark:bg-red-900/30";
                  iconColor = "text-red-600";
                  Icon = TrendingDown;
                } else if (monthlyChange < 0) {
                  status = "Fair";
                  statusColor = "text-amber-600 dark:text-amber-500";
                  bgColor = "bg-amber-100 dark:bg-amber-900/30";
                  iconColor = "text-amber-600";
                  Icon = TrendingDown;
                }
                
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className={`text-3xl font-bold ${statusColor}`}>{status}</div>
                      <div className={`text-sm font-medium mt-1 ${isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {isPositive ? '+' : ''}{Math.abs(monthlyChange).toFixed(1)}% from last month
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(metrics?.revenue?.currentMonth || 0)} this month
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${iconColor}`} />
                </div>
              </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Common tasks</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Record Payment
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Bell className="w-4 h-4" />
                Set Reminder
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Income vs Expenses Breakdown - Area Chart */}
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Income vs Expenses Breakdown</CardTitle>
                <CardDescription>Compare income and expenses to visualize net cash flow over time</CardDescription>
              </CardHeader>
              <CardContent>
                {incomeExpensesData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={incomeExpensesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                          dataKey="income" 
                          stroke="#22c55e" 
                          strokeWidth={2.5}
                          fill="url(#incomeGradient)"
                          name="Income"
                          stackId="1"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#ef4444" 
                          strokeWidth={2.5}
                          fill="url(#expensesGradient)"
                          name="Expenses"
                          stackId="2"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="net" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                          name="Net Cash Flow"
                        />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Income</span>
                          <p className="font-semibold text-green-600 dark:text-green-500 mt-1">
                            {formatCurrency(incomeExpensesData.reduce((sum: number, item: any) => sum + (item.income || 0), 0))}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Expenses</span>
                          <p className="font-semibold text-red-600 dark:text-red-500 mt-1">
                            {formatCurrency(incomeExpensesData.reduce((sum: number, item: any) => sum + (item.expenses || 0), 0))}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Cash Flow</span>
                          <p className={`font-semibold mt-1 ${
                            incomeExpensesData.reduce((sum: number, item: any) => sum + (item.net || 0), 0) >= 0
                              ? 'text-green-600 dark:text-green-500'
                              : 'text-red-600 dark:text-red-500'
                          }`}>
                            {formatCurrency(incomeExpensesData.reduce((sum: number, item: any) => sum + (item.net || 0), 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No income/expense data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category-Based Expense Distribution - Donut Chart */}
              <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Category-Based Expense Distribution</CardTitle>
                  <CardDescription>Expense share by category (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  {expenseCategoriesData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={expenseCategoriesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            innerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseCategoriesData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                            }}
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value: string) => value}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                          {expenseCategoriesData.slice(0, 5).map((item: any, index: number) => {
                            const total = expenseCategoriesData.reduce((sum: number, cat: any) => sum + cat.value, 0);
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;
                            return (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                                  />
                                  <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                                  <span className="text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <p>No expense data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cash Flow Statement - Redesigned */}
              <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground">Cash Flow Statement</CardTitle>
                        <CardDescription className="mt-1">Comprehensive view of cash inflows and outflows</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (() => {
                    // Calculate operating activities
                    const operatingIncome = metrics?.revenue?.total || 0;
                    
                    // Calculate total expenses from expenses table
                    const expensesFromTable = (metrics?.incomeExpenses || []).reduce((sum: number, item: any) => {
                      return sum + parseFloat(item.expenses || 0);
                    }, 0);
                    
                    // Calculate total spoilage costs
                    const totalSpoilageCost = spoilageData.reduce((sum: number, record: any) => {
                      return sum + parseFloat(record.totalCost || 0);
                    }, 0);
                    
                    // Combine all operating expenses (expenses table + spoilage)
                    const operatingExpenses = expensesFromTable + totalSpoilageCost;
                    const operatingNet = operatingIncome - operatingExpenses;

                    // Investing and Financing (placeholder for future implementation)
                    const investingIncome = 0;
                    const investingExpenses = 0;
                    const investingNet = investingIncome - investingExpenses;

                    const financingIncome = 0;
                    const financingExpenses = 0;
                    const financingNet = financingIncome - financingExpenses;

                    // Calculate totals
                    const totalNetCashFlow = operatingNet + investingNet + financingNet;
                    const beginningCash = 0; // Would be tracked separately
                    const endingCash = beginningCash + totalNetCashFlow;

                    return (
                      <div className="space-y-6">
                        {/* Operating Activities */}
                        <div className="bg-gradient-to-br from-card to-primary/5 rounded-xl border border-primary/20 p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <h3 className="text-lg font-bold text-foreground">Operating Activities</h3>
                          </div>
                          <div className="space-y-3 pl-4">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Inflows</span>
                              </div>
                              <span className="text-base font-semibold text-green-600 dark:text-green-500 tabular-nums">
                                {formatCurrency(operatingIncome)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Outflows</span>
                              </div>
                              <span className="text-base font-semibold text-red-600 dark:text-red-500 tabular-nums">
                                {formatCurrency(operatingExpenses)}
                              </span>
                            </div>
                            <div className="pt-3 mt-3 border-t-2 border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-foreground">Net Operating Cash Flow</span>
                                <span className={`text-lg font-bold tabular-nums ${
                                  operatingNet >= 0 
                                    ? 'text-green-600 dark:text-green-500' 
                                    : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {operatingNet >= 0 ? '+' : ''}{formatCurrency(operatingNet)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Investing Activities */}
                        <div className="bg-gradient-to-br from-card to-blue-500/5 rounded-xl border border-blue-500/20 p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <h3 className="text-lg font-bold text-foreground">Investing Activities</h3>
                          </div>
                          <div className="space-y-3 pl-4">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Inflows</span>
                              </div>
                              <span className="text-base font-semibold text-green-600 dark:text-green-500 tabular-nums">
                                {formatCurrency(investingIncome)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Outflows</span>
                              </div>
                              <span className="text-base font-semibold text-red-600 dark:text-red-500 tabular-nums">
                                {formatCurrency(investingExpenses)}
                              </span>
                            </div>
                            <div className="pt-3 mt-3 border-t-2 border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-foreground">Net Investing Cash Flow</span>
                                <span className={`text-lg font-bold tabular-nums ${
                                  investingNet >= 0 
                                    ? 'text-green-600 dark:text-green-500' 
                                    : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {investingNet >= 0 ? '+' : ''}{formatCurrency(investingNet)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Financing Activities */}
                        <div className="bg-gradient-to-br from-card to-purple-500/5 rounded-xl border border-purple-500/20 p-5 shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <h3 className="text-lg font-bold text-foreground">Financing Activities</h3>
                          </div>
                          <div className="space-y-3 pl-4">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Inflows</span>
                              </div>
                              <span className="text-base font-semibold text-green-600 dark:text-green-500 tabular-nums">
                                {formatCurrency(financingIncome)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-500" />
                                <span className="text-sm font-medium text-muted-foreground">Cash Outflows</span>
                              </div>
                              <span className="text-base font-semibold text-red-600 dark:text-red-500 tabular-nums">
                                {formatCurrency(financingExpenses)}
                              </span>
                            </div>
                            <div className="pt-3 mt-3 border-t-2 border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-foreground">Net Financing Cash Flow</span>
                                <span className={`text-lg font-bold tabular-nums ${
                                  financingNet >= 0 
                                    ? 'text-green-600 dark:text-green-500' 
                                    : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {financingNet >= 0 ? '+' : ''}{formatCurrency(financingNet)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Consolidated Summary */}
                        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-xl border-2 border-primary/30 p-6 shadow-lg">
                          <div className="flex items-center gap-2 mb-5">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-bold text-foreground">Consolidated Summary</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium text-muted-foreground">Beginning Cash Balance</span>
                              <span className="text-base font-semibold text-foreground tabular-nums">
                                {formatCurrency(beginningCash)}
                              </span>
                            </div>
                            <div className="pt-3 border-t-2 border-primary/20">
                              <div className="flex items-center justify-between py-2">
                                <span className="text-base font-bold text-foreground">Total Net Cash Flow</span>
                                <span className={`text-2xl font-bold tabular-nums ${
                                  totalNetCashFlow >= 0 
                                    ? 'text-green-600 dark:text-green-500' 
                                    : 'text-red-600 dark:text-red-500'
                                }`}>
                                  {totalNetCashFlow >= 0 ? '+' : ''}{formatCurrency(totalNetCashFlow)}
                                </span>
                              </div>
                            </div>
                            <div className="pt-4 mt-4 border-t-2 border-primary/30">
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-foreground">Ending Cash Balance</span>
                                <span className="text-2xl font-bold text-primary tabular-nums">
                                  {formatCurrency(endingCash)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Cash Flow Chart */}
            <CashflowChart />

            {/* Category Breakdown */}
            <CategoryBreakdown />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowTrendChart />
              <CashflowChart />
            </div>
            <CategoryBreakdown />
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast">
            <CashFlowForecast />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Cashflow;
