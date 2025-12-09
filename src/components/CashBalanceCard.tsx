import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/hooks/use-currency";

export function CashBalanceCard() {
  const [balance, setBalance] = useState<{ current: number; previous: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data) {
          // Calculate current balance from total revenue
          const current = response.data.revenue?.total || 0;
          // Previous balance would need to be calculated from previous period
          // For now, use a simple calculation
          const previous = current * 0.9; // Placeholder - should be calculated from previous period
          setBalance({ current, previous });
        }
      } catch (error) {
        console.error('Failed to fetch cash balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (loading || !balance) {
    return (
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const change = balance.current - balance.previous;
  const changePercent = balance.previous > 0 ? ((change / balance.previous) * 100).toFixed(1) : '0.0';

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">Current Cash Balance</p>
            </div>
            <h3 className="text-4xl font-bold text-foreground mb-3">
              {formatCurrency(balance.current)}
            </h3>
            <div className="flex items-center gap-2">
              {change >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{formatCurrency(Math.abs(change))} ({changePercent}%)
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(Math.abs(change))} ({changePercent}%)
                  </span>
                </>
              )}
              <span className="text-sm text-muted-foreground">vs last period</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

