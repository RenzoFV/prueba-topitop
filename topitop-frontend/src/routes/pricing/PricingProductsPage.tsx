import { useState } from "react";
import { toast } from "sonner";
import {
  usePricingConfig,
  usePricingProducts,
  useRestock,
  useUpdatePrice,
  type PricedProduct,
} from "@/features/pricing/hooks";
import { formatPEN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pencil, Package2, Loader2 } from "lucide-react";

export function PricingProductsPage() {
  const { data: products = [], isLoading } = usePricingProducts();
  const { data: config } = usePricingConfig();
  const minMargin = config?.minMarginPct ?? 20;
  const [editing, setEditing] = useState<PricedProduct | null>(null);
  const [restocking, setRestocking] = useState<PricedProduct | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <p className="text-sm text-muted-foreground">
          Edita precios respetando el margen mínimo ({minMargin}%) o ajusta el stock.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-40 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {products.map((p) => {
              const belowMargin = p.margin < minMargin;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-right">
                    {formatPEN(p.cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPEN(p.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={belowMargin ? "destructive" : "secondary"}>
                      {p.margin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil className="size-4" />
                      Precio
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRestocking(p)}
                    >
                      <Package2 className="size-4" />
                      Stock
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay productos cargados todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditPriceDialog
        product={editing}
        minMargin={minMargin}
        onClose={() => setEditing(null)}
      />
      <RestockDialog
        product={restocking}
        onClose={() => setRestocking(null)}
      />
    </div>
  );
}

function EditPriceDialog({
  product,
  minMargin,
  onClose,
}: {
  product: PricedProduct | null;
  minMargin: number;
  onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  const updatePrice = useUpdatePrice();

  const cost = product?.cost ?? 0;
  const minPrice = +(cost * (1 + minMargin / 100)).toFixed(2);
  const parsed = Number(price);
  const newMargin = cost > 0 ? ((parsed - cost) / cost) * 100 : 0;
  const valid = Number.isFinite(parsed) && parsed >= minPrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    try {
      await updatePrice.mutateAsync({ id: product.id, price: parsed });
      toast.success("Precio actualizado");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) {
          setPrice("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar precio</DialogTitle>
            <DialogDescription>
              {product?.title} · Costo {formatPEN(cost)} · Precio mínimo permitido{" "}
              <span className="font-semibold">{formatPEN(minPrice)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="price">Nuevo precio (S/)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={String(product?.price ?? "")}
              autoFocus
            />
            {price && (
              <p
                className={`text-xs ${
                  valid ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                Margen resultante: {newMargin.toFixed(1)}%{" "}
                {!valid && `(debajo del mínimo ${minMargin}%)`}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!valid || updatePrice.isPending}
            >
              {updatePrice.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RestockDialog({
  product,
  onClose,
}: {
  product: PricedProduct | null;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<"restock" | "adjustment" | "return">(
    "restock",
  );
  const [note, setNote] = useState("");
  const restock = useRestock();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) {
      toast.error("Ingresa una cantidad distinta de cero");
      return;
    }
    try {
      await restock.mutateAsync({
        id: product.id,
        deltaQty: n,
        reason,
        note: note || undefined,
      });
      toast.success("Stock actualizado");
      setDelta("");
      setNote("");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) {
          setDelta("");
          setNote("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
            <DialogDescription>
              {product?.title} · Stock actual: {product?.stock}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razón</Label>
              <Select
                value={reason}
                onValueChange={(v) =>
                  setReason(v as "restock" | "adjustment" | "return")
                }
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Reabastecimiento</SelectItem>
                  <SelectItem value="adjustment">Ajuste de inventario</SelectItem>
                  <SelectItem value="return">Devolución</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delta">Cantidad (positiva o negativa)</Label>
              <Input
                id="delta"
                type="number"
                step="1"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="Ej: 50 para sumar, -3 para descontar"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Nota (opcional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Lote, proveedor, motivo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={restock.isPending}>
              {restock.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Aplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
