import { Outlet } from "react-router";
import { AppShell } from "@/components/AppShell";

export function OrdersLayout() {
  return (
    <AppShell
      section="Order Management"
      nav={[
        { label: "Resumen", to: "/orders" },
        { label: "Pedidos", to: "/orders/list" },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
