import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

const currentBalance = 17760;
const previousBalance = 15700;
const change = currentBalance - previousBalance;
const changePercent = ((change / previousBalance) * 100).toFixed(1);

export function CashBalanceCard() {
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
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-2">
              {change >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({changePercent}%)
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    -${Math.abs(change).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({changePercent}%)
                  </span>
                </>
              )}
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

