import { Outlet } from "react-router";
import { AppShell } from "@/components/AppShell";

export function PricingLayout() {
  return (
    <AppShell
      section="Pricing"
      nav={[
        { label: "Resumen", to: "/pricing" },
        { label: "Productos", to: "/pricing/products" },
        { label: "Promociones", to: "/pricing/promotions" },
        { label: "Stock", to: "/pricing/stock" },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
