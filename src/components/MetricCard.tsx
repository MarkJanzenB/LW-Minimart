import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: number;
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ title, value, subtitle, trend, icon: Icon, iconColor = "text-accent" }: MetricCardProps) {
  const isPositive = trend > 0;
  
  return (
    <Card className="p-6 bg-card border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-3xl font-bold text-card-foreground">{value}</h3>
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          </div>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-chart-income" />
            ) : (
              <TrendingDown className="w-4 h-4 text-chart-expenses" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-chart-income' : 'text-chart-expenses'}`}>
              {isPositive ? '+' : ''}{trend}% from last {title.includes('Orders') ? 'week' : 'month'}
            </span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
