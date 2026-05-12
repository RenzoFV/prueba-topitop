import {
  usePricingConfig,
  usePricingProducts,
  usePromotions,
} from "@/features/pricing/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, AlertTriangle, TrendingUp } from "lucide-react";

export function PricingDashboard() {
  const { data: products = [] } = usePricingProducts();
  const { data: promos = [] } = usePromotions();
  const { data: config } = usePricingConfig();

  const minMargin = config?.minMarginPct ?? 20;
  const belowMargin = products.filter((p) => p.margin < minMargin).length;
  const activePromos = promos.filter((p) => p.active).length;
  const avgMargin =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.margin, 0) / products.length
      : 0;

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
          <Tag className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de precios
          </h1>
          <p className="text-sm text-muted-foreground">
            Listas de precios, promociones y reestockeo. Margen mínimo: <span className="font-semibold">{minMargin}%</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Margen promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">
              {avgMargin.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="size-4" />
              Bajo el margen mínimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{belowMargin}</span>
            <p className="text-xs text-muted-foreground">
              productos por debajo de {minMargin}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promociones activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{activePromos}</span>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
