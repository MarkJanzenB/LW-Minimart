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
import { Download, Filter } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Cash Flow</h1>
            <p className="text-muted-foreground">Track your cash inflows, outflows, and balance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <AddTransactionDialog />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2 p-4 bg-card border rounded-lg">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <DateRangeFilter onDateChange={handleDateChange} />
        </div>

        {/* Cash Balance Card */}
        <CashBalanceCard />

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
