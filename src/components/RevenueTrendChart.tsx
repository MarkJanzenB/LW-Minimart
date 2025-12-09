import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { day: "Mon", revenue: 2500 },
  { day: "Tue", revenue: 1500 },
  { day: "Wed", revenue: 10000 },
  { day: "Thu", revenue: 3800 },
  { day: "Fri", revenue: 4900 },
  { day: "Sat", revenue: 3600 },
  { day: "Sun", revenue: 4400 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card px-3 py-2 rounded-lg border border-border shadow-lg">
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <p className="text-sm text-accent font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Revenue Trend</h3>
        <p className="text-sm text-muted-foreground">Weekly revenue tracking</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="day" 
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
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--chart-bar))" 
            strokeWidth={2.5}
            dot={{ fill: 'hsl(var(--chart-bar))', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
