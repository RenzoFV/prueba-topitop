import { useState } from "react";
import { Link } from "react-router";
import { useOrders } from "@/features/orders/hooks";
import type { OrderStatus } from "@/features/products/types";
import { formatPEN, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  confirmed: "secondary",
  shipped: "default",
  delivered: "secondary",
  cancelled: "destructive",
};

export function OrdersListPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const { data: orders = [], isLoading } = useOrders({
    status: status === "all" ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Listado completo de pedidos. Click en cualquiera para ver detalle y tracking.
          </p>
        </div>
        <Button asChild>
          <Link to="/orders/new">
            <Plus className="size-4" />
            Nuevo pedido
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as OrderStatus | "all")}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">
                  <Link
                    to={`/orders/list/${o.id}`}
                    className="font-medium hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.customerEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {o.shippingCity}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(o.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[o.status]}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatPEN(o.total)}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay pedidos para este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
