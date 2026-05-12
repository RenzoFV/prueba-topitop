import { Logo } from "@/components/Logo";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <div className="inline-flex rounded-md bg-background px-3 py-2">
              <Logo size={28} />
            </div>
            <p className="text-sm text-background/70">
              Portal interno para la gestión de catálogo, precios y órdenes.
            </p>
          </div>

          <FooterColumn
            title="Sistema"
            items={["Administración", "Roles y permisos", "Auditoría"]}
          />
          <FooterColumn
            title="Operaciones"
            items={["PIM", "Pricing", "Order Management"]}
          />
          <FooterColumn
            title="Soporte"
            items={["Documentación", "Mesa de ayuda", "Contacto"]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-background/15 pt-6 text-xs text-background/60 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} Topitop. Todos los derechos reservados.
          </span>
          <span>v1.0 · Portal interno</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-background">
        {title}
      </h4>
      <ul className="space-y-2 text-sm text-background/70">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
