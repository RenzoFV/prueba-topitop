import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  useOrder,
  useUpdateOrderStatus,
  useUpdateTracking,
} from "@/features/orders/hooks";
import type { OrderStatus } from "@/features/products/types";
import { formatPEN, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ORDER_STATUS_LABEL } from "./OrdersListPage";
import { ArrowLeft, Loader2, Truck, ExternalLink } from "lucide-react";

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

const CARRIERS = [
  { value: "Olva", label: "Olva Courier" },
  { value: "Shalom", label: "Shalom" },
  { value: "Serpost", label: "Serpost" },
  { value: "Otro", label: "Otro" },
];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateTracking = useUpdateTracking();

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  if (isLoading || !data || !id) return <FullPageSpinner />;

  const { order, items } = data;

  async function handleStatusChange(status: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id: id!, status });
      toast.success("Estado actualizado");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleSubmitTracking(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateTracking.mutateAsync({
        id: id!,
        carrier,
        trackingNumber,
        trackingUrl: trackingUrl || undefined,
      });
      toast.success("Tracking guardado y pedido marcado como enviado");
      setCarrier("");
      setTrackingNumber("");
      setTrackingUrl("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pedido {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Creado el {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{order.customerName}</div>
            <div className="text-muted-foreground">{order.customerEmail}</div>
            <div className="text-muted-foreground">{order.customerPhone || "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>{order.shippingAddress}</div>
            <div className="text-muted-foreground">{order.shippingCity}</div>
            {order.carrier && (
              <div className="pt-2">
                <Badge variant="outline" className="gap-1.5">
                  <Truck className="size-3" />
                  {order.carrier} · {order.trackingNumber}
                </Badge>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Ver tracking
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-xs">
                    {it.productSnapshot.sku}
                  </TableCell>
                  <TableCell className="font-medium">
                    {it.productSnapshot.title}
                  </TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatPEN(it.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPEN(it.unitPrice * it.quantity)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPEN(order.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar estado</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={order.status}
            onValueChange={(v) => handleStatusChange(v as OrderStatus)}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {order.status !== "delivered" && order.status !== "cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmitTracking}
              className="grid gap-4 md:grid-cols-3"
            >
              <div className="space-y-2">
                <Label>Courier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tn">Número de guía</Label>
                <Input
                  id="tn"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="OLV-998877"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tu">URL de tracking (opcional)</Label>
                <Input
                  id="tu"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    !carrier || !trackingNumber || updateTracking.isPending
                  }
                >
                  {updateTracking.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  <Truck className="size-4" />
                  Guardar y marcar como enviado
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
