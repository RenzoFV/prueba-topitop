import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateOrder } from "@/features/orders/hooks";
import { useProducts } from "@/features/products/hooks";
import { formatPEN } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Loader2, Plus, X } from "lucide-react";

const schema = z.object({
  customerName: z.string().min(1, "Requerido"),
  customerEmail: z.email("Correo inválido"),
  customerPhone: z.string(),
  shippingAddress: z.string().min(1, "Requerido"),
  shippingCity: z.string().min(1, "Requerido"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Line = { productId: string; quantity: number };

export function OrderCreatePage() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts({ status: "published" });
  const create = useCreateOrder();
  const [lines, setLines] = useState<Line[]>([]);
  const [picker, setPicker] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      shippingCity: "",
      notes: "",
    },
  });

  const total = lines.reduce((sum, line) => {
    const p = products.find((x) => x.id === line.productId);
    return sum + (p ? p.price * line.quantity : 0);
  }, 0);

  function addLine(productId: string) {
    if (!productId) return;
    setLines((prev) =>
      prev.some((l) => l.productId === productId)
        ? prev.map((l) =>
            l.productId === productId
              ? { ...l, quantity: l.quantity + 1 }
              : l,
          )
        : [...prev, { productId, quantity: 1 }],
    );
    setPicker("");
  }

  function updateQty(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  async function onSubmit(values: FormValues) {
    if (lines.length === 0) {
      toast.error("Agrega al menos un producto al pedido");
      return;
    }
    try {
      const order = await create.mutateAsync({ ...values, items: lines });
      toast.success(`Pedido ${order.orderNumber} creado`);
      navigate(`/orders/list/${order.id}`, { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shippingCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Lima" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="shippingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Productos
                </h3>
                <div className="flex gap-2">
                  <Select value={picker} onValueChange={addLine}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un producto para agregar" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={p.stock <= 0}
                        >
                          {p.title} — {formatPEN(p.price)}{" "}
                          {p.stock <= 0 ? "(sin stock)" : `(stock ${p.stock})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {lines.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-32 text-right">Precio</TableHead>
                        <TableHead className="w-32">Cantidad</TableHead>
                        <TableHead className="w-32 text-right">Subtotal</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => {
                        const p = products.find((x) => x.id === line.productId);
                        if (!p) return null;
                        return (
                          <TableRow key={line.productId}>
                            <TableCell className="font-medium">
                              {p.title}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPEN(p.price)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                max={p.stock}
                                value={line.quantity}
                                onChange={(e) =>
                                  updateQty(
                                    line.productId,
                                    Math.max(1, Number(e.target.value)),
                                  )
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPEN(p.price * line.quantity)}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLine(line.productId)}
                              >
                                <X className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPEN(total)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  <Plus className="size-4" />
                  Crear pedido
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
