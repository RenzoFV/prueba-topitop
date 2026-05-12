import { Outlet } from "react-router";
import { AppShell } from "@/components/AppShell";

export function PimLayout() {
  return (
    <AppShell
      section="PIM"
      nav={[
        { label: "Catálogo", to: "/pim/products" },
        { label: "Resumen", to: "/pim" },
      ]}
    >
      <Outlet />
    </AppShell>
  );
}
