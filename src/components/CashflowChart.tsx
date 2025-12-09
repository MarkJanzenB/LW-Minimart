import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const cashflowData = [
  { date: "Nov 25", income: 450, expenses: 150, revenue: 300 },
  { date: "Nov 26", income: 520, expenses: 180, revenue: 340 },
  { date: "Nov 27", income: 480, expenses: 200, revenue: 280 },
  { date: "Nov 28", income: 560, expenses: 220, revenue: 340 },
  { date: "Nov 29", income: 490, expenses: 190, revenue: 300 },
  { date: "Nov 30", income: 530, expenses: 210, revenue: 320 },
  { date: "Dec 1", income: 570, expenses: 230, revenue: 340 },
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
            wrapperStyle={{ 
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '10px'
            }}
            iconType="circle"
            formatter={(value, entry: any, index) => {
              let color = '';
              switch (value) {
                case 'Income': color = '#22c55e'; break;
                case 'Expenses': color = '#ef4444'; break;
                case 'Profit': color = '#3b82f6'; break;
                default: color = '#000';
              }
              return <span style={{ color }}>{value}</span>;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="income" 
            name="Gross Income"
            stroke="#3b82f6" // Blue
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            name="Expenses"
            stroke="#ef4444" // Red
            strokeWidth={2.5}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            name="Revenue"
            stroke="#22c55e" // Green
            strokeWidth={2.5}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
