import { useStockMovements } from "@/features/pricing/hooks";
import { usePricingProducts } from "@/features/pricing/hooks";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REASON_LABEL: Record<string, string> = {
  restock: "Reabastecimiento",
  adjustment: "Ajuste",
  sale: "Venta",
  return: "Devolución",
};

export function StockPage() {
  const { data: movements = [], isLoading } = useStockMovements();
  const { data: products = [] } = usePricingProducts();
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Movimientos de stock
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de reabastecimientos, ajustes, ventas y devoluciones.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Razón</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading &&
              movements.map((m) => {
                const product = byId.get(m.productId);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{REASON_LABEL[m.reason] ?? m.reason}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        m.deltaQty > 0
                          ? "text-emerald-600"
                          : "text-destructive"
                      }`}
                    >
                      {m.deltaQty > 0 ? `+${m.deltaQty}` : m.deltaQty}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.note ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            {!isLoading && movements.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Sin movimientos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
