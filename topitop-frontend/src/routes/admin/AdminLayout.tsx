import { Outlet } from "react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useSeed } from "@/features/orders/hooks";
import { Sparkles, Loader2 } from "lucide-react";

export function AdminLayout() {
  const seed = useSeed();

  async function handleSeed() {
    if (
      !confirm(
        "Esto borrará TODOS los productos, promociones y pedidos existentes y los reemplazará con datos de ejemplo. ¿Continuar?",
      )
    )
      return;
    try {
      const result = await seed.mutateAsync();
      toast.success(
        `Seed ejecutado: ${result.products} productos, ${result.orders} pedidos, ${result.promotions} promo`,
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <AppShell
      section="Administración"
      nav={[{ label: "Usuarios", to: "/admin/users" }]}
    >
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          disabled={seed.isPending}
        >
          {seed.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Cargar datos de ejemplo
        </Button>
      </div>
      <Outlet />
    </AppShell>
  );
}
