import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const cashFlowData = {
  operating: {
    income: 24500,
    expenses: 8240,
    net: 16260
  },
  investing: {
    income: 0,
    expenses: 2000,
    net: -2000
  },
  financing: {
    income: 5000,
    expenses: 1500,
    net: 3500
  }
};

const totalNetCashFlow = cashFlowData.operating.net + cashFlowData.investing.net + cashFlowData.financing.net;
const beginningCash = 8900;
const endingCash = beginningCash + totalNetCashFlow;

export function CashFlowStatement() {
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
                  ${cashFlowData.operating.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -${cashFlowData.operating.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Operating Cash Flow</span>
                <span className="font-bold text-foreground">
                  ${cashFlowData.operating.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  ${cashFlowData.investing.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -${cashFlowData.investing.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Investing Cash Flow</span>
                <span className="font-bold text-foreground">
                  ${cashFlowData.investing.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  ${cashFlowData.financing.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Outflows</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -${cashFlowData.financing.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-foreground">Net Financing Cash Flow</span>
                <span className="font-bold text-foreground">
                  ${cashFlowData.financing.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  ${beginningCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Change in Cash</span>
                <span className={`font-medium ${totalNetCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${totalNetCashFlow >= 0 ? '+' : ''}${totalNetCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold text-lg text-foreground">Ending Cash Balance</span>
                <span className="font-bold text-lg text-primary">
                  ${endingCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

