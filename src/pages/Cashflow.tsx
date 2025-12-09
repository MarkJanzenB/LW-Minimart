import { useState } from "react";
import { CashflowChart } from "@/components/CashflowChart";
import { CashFlowStatement } from "@/components/CashFlowStatement";
import { CashFlowTrendChart } from "@/components/CashFlowTrendChart";
import { CashBalanceCard } from "@/components/CashBalanceCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionList } from "@/components/TransactionList";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { CashFlowForecast } from "@/components/CashFlowForecast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Download, Filter, Plus, FileText, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Cashflow = () => {
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

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
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Cash Flow Health</CardTitle>
              <p className="text-sm text-muted-foreground">Your financial stability indicator</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-3xl font-bold text-green-600">Good</div>
                  <div className="text-sm text-muted-foreground mt-1">+12% from last month</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Statement */}
              <CashFlowStatement />

              {/* Cash Flow Trend Chart */}
              <CashFlowTrendChart />
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
