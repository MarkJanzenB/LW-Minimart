import { Card } from "@/components/ui/card";

const regionData = [
  { rank: "#1", country: "United States", flag: "🇺🇸", sales: 12584 },
  { rank: "#2", country: "United Kingdom", flag: "🇬🇧", sales: 9876 },
  { rank: "#3", country: "Canada", flag: "🇨🇦", sales: 7654 },
  { rank: "#4", country: "Australia", flag: "🇦🇺", sales: 6543 },
  { rank: "#5", country: "Germany", flag: "🇩🇪", sales: 5432 },
];

export function SalesByRegionTable() {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Sales by Region</h3>
        <p className="text-sm text-muted-foreground">Top performing regions</p>
      </div>
      
      <div className="space-y-3">
        {regionData.map((region) => (
          <div key={region.rank} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-8">{region.rank}</span>
              <span className="text-2xl">{region.flag}</span>
              <span className="text-sm font-medium text-card-foreground">{region.country}</span>
            </div>
            <span className="text-sm font-bold text-card-foreground">${region.sales.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
