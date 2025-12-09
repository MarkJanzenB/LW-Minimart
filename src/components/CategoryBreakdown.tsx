import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const incomeData = [
  { name: "Sales", value: 18500, color: "#22c55e" },
  { name: "Services", value: 4500, color: "#10b981" },
  { name: "Investment", value: 1000, color: "#3b82f6" },
  { name: "Other", value: 500, color: "#8b5cf6" },
];

const expenseData = [
  { name: "Inventory", value: 3200, color: "#ef4444" },
  { name: "Operations", value: 1800, color: "#f59e0b" },
  { name: "Marketing", value: 1500, color: "#8b5cf6" },
  { name: "Utilities", value: 1200, color: "#06b6d4" },
  { name: "Rent", value: 540, color: "#ec4899" },
];

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
  const incomeTotal = incomeData.reduce((sum, item) => sum + item.value, 0);
  const expenseTotal = expenseData.reduce((sum, item) => sum + item.value, 0);

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

