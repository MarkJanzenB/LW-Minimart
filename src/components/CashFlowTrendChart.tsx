import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CashFlowTrendChart() {
  const [monthlyCashFlow, setMonthlyCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchTrendData = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data?.recentTransactions) {
          // Group transactions by month
          const monthlyData = response.data.recentTransactions.reduce((acc: any, t: any) => {
            const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
            if (!acc[month]) {
              acc[month] = { month, operating: 0, investing: 0, financing: 0, net: 0 };
            }
            acc[month].operating += t.revenue || 0;
            acc[month].net += t.revenue || 0;
            return acc;
          }, {});
          setMonthlyCashFlow(Object.values(monthlyData));
        } else {
          setMonthlyCashFlow([]);
        }
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
        setMonthlyCashFlow([]);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // Fetch immediately on mount
    fetchTrendData();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(fetchTrendData, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="text-xl font-semibold">Monthly Cash Flow Trends</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[350px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : monthlyCashFlow.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <p>No trend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyCashFlow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOperating" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvesting" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFinancing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="operating"
              name="Operating"
              stackId="1"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorOperating)"
            />
            <Area
              type="monotone"
              dataKey="investing"
              name="Investing"
              stackId="1"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#colorInvesting)"
            />
            <Area
              type="monotone"
              dataKey="financing"
              name="Financing"
              stackId="1"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorFinancing)"
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

