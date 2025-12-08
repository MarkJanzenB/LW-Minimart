import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const cashflowData = [
  { date: "Nov 25", income: 100, expenses: 150, profit: -50 },
  { date: "Nov 26", income: 189.75, expenses: 500, profit: -310.25 },
  { date: "Nov 27", income: 250, expenses: 200, profit: 50 },
  { date: "Nov 28", income: 180, expenses: 150, profit: 30 },
  { date: "Nov 29", income: 160, expenses: 100, profit: 60 },
  { date: "Nov 30", income: 200, expenses: 120, profit: 80 },
  { date: "Dec 1", income: 220, expenses: 140, profit: 80 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary/95 px-4 py-3 rounded-lg border border-primary-foreground/20 shadow-lg">
        <p className="text-primary-foreground font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CashflowChart() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-card-foreground">7-Day Cashflow Overview</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={cashflowData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            name="Income"
            stroke="hsl(var(--chart-income))" 
            strokeWidth={2.5}
            dot={{ fill: 'hsl(var(--chart-income))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            name="Expenses"
            stroke="hsl(var(--chart-expenses))" 
            strokeWidth={2.5}
            dot={{ fill: 'hsl(var(--chart-expenses))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            name="Profit"
            stroke="hsl(var(--chart-profit))" 
            strokeWidth={2.5}
            dot={{ fill: 'hsl(var(--chart-profit))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
