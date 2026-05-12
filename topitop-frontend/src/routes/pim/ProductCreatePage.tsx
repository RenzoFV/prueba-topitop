import { useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useCreateProduct } from "@/features/products/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "./ProductForm";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const createProduct = useCreateProduct();
  // Generamos un ID temporal solo para que el uploader pueda agrupar archivos
  // antes de tener un producto real. Cuando se guarda, las URLs ya están subidas.
  const tempId = useMemo(() => `draft-${crypto.randomUUID()}`, []);

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            productId={tempId}
            submitting={createProduct.isPending}
            submitLabel="Crear producto"
            onSubmit={async (values) => {
              try {
                const p = await createProduct.mutateAsync(values);
                toast.success("Producto creado");
                navigate(`/pim/products/${p.id}`, { replace: true });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onCancel={() => navigate(-1)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
