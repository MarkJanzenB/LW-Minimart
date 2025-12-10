import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#22c55e", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground mb-1">{data.name}</p>
        <p className="text-sm" style={{ color: data.payload.fill }}>
          <span className="font-medium">Amount:</span> ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryBreakdown() {
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchCategoryData = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data) {
          // Income data from transactions (all transactions are sales/income)
          const totalRevenue = response.data.revenue?.total || 0;
          setIncomeData([
            { name: "Sales", value: totalRevenue, color: COLORS[0] },
          ]);
          
          // Expense data would need separate tracking - for now empty
          setExpenseData([]);
        }
      } catch (error) {
        console.error('Failed to fetch category data:', error);
        setIncomeData([]);
        setExpenseData([]);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // Fetch immediately on mount
    fetchCategoryData();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(fetchCategoryData, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const incomeTotal = incomeData.reduce((sum, item) => sum + item.value, 0);
  const expenseTotal = expenseData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-[250px]">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-[250px]">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Income Breakdown */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Income by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {incomeData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <p>No income data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 space-y-2">
            {incomeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">
                  ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Total Income</span>
                <span className="text-green-600 dark:text-green-400">
                  ${incomeTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">Expenses by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {expenseData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <p>No expense data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 space-y-2">
            {expenseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">
                  ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Total Expenses</span>
                <span className="text-red-600 dark:text-red-400">
                  ${expenseTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

