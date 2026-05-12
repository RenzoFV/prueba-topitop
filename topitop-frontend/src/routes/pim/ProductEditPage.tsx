import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  useProduct,
  useProductAudit,
  useUpdateProduct,
} from "@/features/products/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ProductForm } from "./ProductForm";
import { formatDate } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  create: "Creación",
  update: "Actualización",
  delete: "Archivado",
  restore: "Restauración",
};

export function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const { data: audit = [] } = useProductAudit(id);
  const update = useUpdateProduct(id ?? "");

  if (isLoading || !product || !id) return <FullPageSpinner />;

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
        <p className="text-sm text-muted-foreground">
          SKU <span className="font-mono">{product.sku}</span>
        </p>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Datos del producto</TabsTrigger>
          <TabsTrigger value="audit">
            Historial ({audit.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardContent className="pt-6">
              <ProductForm
                productId={product.id}
                defaultValues={{
                  sku: product.sku,
                  title: product.title,
                  description: product.description,
                  category: product.category,
                  images: product.images,
                  status: product.status,
                  cost: product.cost,
                  price: product.price,
                  stock: product.stock,
                }}
                submitting={update.isPending}
                onSubmit={async (values) => {
                  try {
                    await update.mutateAsync(values);
                    toast.success("Producto actualizado");
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
                onCancel={() => navigate(-1)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Historial de cambios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {audit.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sin movimientos registrados.
                </p>
              )}
              {audit.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border bg-card p-3 text-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  )}
                  {Object.keys(entry.changes).length > 0 && (
                    <ul className="space-y-1 text-xs">
                      {Object.entries(entry.changes).map(([field, c]) => (
                        <li key={field} className="font-mono">
                          <span className="font-semibold">{field}:</span>{" "}
                          <span className="text-muted-foreground line-through">
                            {JSON.stringify(c.from)}
                          </span>{" "}
                          → <span>{JSON.stringify(c.to)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
