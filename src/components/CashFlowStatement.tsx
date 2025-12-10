import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/hooks/use-currency";

export function CashFlowStatement() {
  const [cashFlowData, setCashFlowData] = useState<{
    operating: { income: number; expenses: number; net: number };
    investing: { income: number; expenses: number; net: number };
    financing: { income: number; expenses: number; net: number };
  } | null>(null);
  const [beginningCash, setBeginningCash] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialLoad = true;
    
    const fetchCashFlow = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await (window as any).api.dashboard.getMetrics();
        if (response.success && response.data) {
          // Calculate cash flow from transactions
          const operatingIncome = response.data.revenue?.total || 0;
          const operatingExpenses = 0; // Expenses tracking to be implemented
          const operatingNet = operatingIncome - operatingExpenses;

          setCashFlowData({
            operating: {
              income: operatingIncome,
              expenses: operatingExpenses,
              net: operatingNet
            },
            investing: {
              income: 0,
              expenses: 0,
              net: 0
            },
            financing: {
              income: 0,
              expenses: 0,
              net: 0
            }
          });

          // Beginning cash would need to be tracked separately
          setBeginningCash(0);
        }
      } catch (error) {
        console.error('Failed to fetch cash flow data:', error);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
          isInitialLoad = false;
        }
      }
    };

    // Fetch immediately on mount
    fetchCashFlow();

    // Set up polling for real-time updates every 5 seconds
    const intervalId = setInterval(fetchCashFlow, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading || !cashFlowData) {
    return (
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-semibold">Cash Flow Statement</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalNetCashFlow = cashFlowData.operating.net + cashFlowData.investing.net + cashFlowData.financing.net;
  const endingCash = beginningCash + totalNetCashFlow;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <CardTitle className="text-xl font-semibold">Cash Flow Statement</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Operating Activities */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Operating Activities</h4>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Inflows</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(cashFlowData.operating.income)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(cashFlowData.operating.expenses)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Operating Cash Flow</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cashFlowData.operating.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Investing Activities</h4>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Inflows</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(cashFlowData.investing.income)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(cashFlowData.investing.expenses)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Investing Cash Flow</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cashFlowData.investing.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Financing Activities</h4>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Inflows</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(cashFlowData.financing.income)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(cashFlowData.financing.expenses)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Financing Cash Flow</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cashFlowData.financing.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="pt-4 border-t-2 border-border">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Beginning Cash Balance</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(beginningCash)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Change in Cash</span>
                <span className={`font-medium ${totalNetCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalNetCashFlow >= 0 ? '+' : ''}{formatCurrency(totalNetCashFlow)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold text-lg text-foreground">Ending Cash Balance</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(endingCash)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

