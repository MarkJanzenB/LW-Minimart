import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

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
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchCashflow = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data?.recentTransactions) {
          // Transform recent transactions to cashflow format (last 7 days)
          const data = response.data.recentTransactions.slice(-7).map((t: any) => ({
            date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: t.revenue || 0,
            expenses: 0, // Expenses tracking to be implemented
            profit: t.revenue || 0,
          }));
          setCashflowData(data);
        } else {
          setCashflowData([]);
        }
      } catch (error) {
        console.error('Failed to fetch cashflow data:', error);
        setCashflowData([]);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // Fetch immediately on mount
    fetchCashflow();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(fetchCashflow, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-card-foreground">7-Day Cashflow Overview</h3>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : cashflowData.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          <p>No cashflow data available</p>
        </div>
      ) : (
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
      )}
    </Card>
  );
}
