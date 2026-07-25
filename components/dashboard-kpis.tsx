import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KPIs } from "@/app/types";

interface DashboardKPIsProps {
  kpis: KPIs | null;
}

export function DashboardKPIs({ kpis }: DashboardKPIsProps) {
  const cards = [
    {
      label: "Total Materials",
      value: kpis?.total_materials?.toLocaleString() || "0",
      color: "",
    },
    {
      label: "Active Materials",
      value: kpis?.active_materials?.toLocaleString() || "0",
      color: "text-emerald-600",
    },
    {
      label: "Critical Stock (<30 Days)",
      value: kpis?.critical_stock?.toLocaleString() || "0",
      color: "text-red-600",
    },
    {
      label: "Low Stock (30-60 Days)",
      value: kpis?.low_stock?.toLocaleString() || "0",
      color: "text-orange-500",
    },
    {
      label: "Avg Coverage Days",
      value: kpis?.avg_coverage_days?.toFixed(1) || "0",
      color: "text-blue-600",
    },
    {
      label: "Obsolete Count",
      value: kpis?.obsolete_count?.toLocaleString() || "0",
      color: "text-gray-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <Card
          key={i}
          className="shadow-sm border border-border hover:shadow transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="text-xs font-medium text-muted-foreground tracking-widest uppercase mb-1">
              {card.label}
            </div>
            <div
              className={cn(
                "text-3xl font-semibold tracking-tighter",
                card.color,
              )}
            >
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
