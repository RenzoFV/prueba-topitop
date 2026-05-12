import { Link } from "react-router";
import { useOrders } from "@/features/orders/hooks";
import { formatPEN } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight } from "lucide-react";

export function OrdersDashboard() {
  const { data: orders = [] } = useOrders();
  const pending = orders.filter((o) => o.status === "pending").length;
  const inTransit = orders.filter((o) => o.status === "shipped").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
          <ShoppingCart className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestión de órdenes
          </h1>
          <p className="text-sm text-muted-foreground">
            Pedidos, envíos y tracking. Final del flujo del producto.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En tránsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{inTransit}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{delivered}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{formatPEN(revenue)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Total de pedidos</p>
            <p className="text-sm text-muted-foreground">
              {orders.length} pedido{orders.length === 1 ? "" : "s"} registrado{orders.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Button asChild>
            <Link to="/orders/list">
              Ver pedidos
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
