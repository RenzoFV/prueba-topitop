import { Link } from "react-router";
import { useProducts } from "@/features/products/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";

export function PimDashboard() {
  const { data: products = [] } = useProducts();
  const published = products.filter((p) => p.status === "published").length;
  const drafts = products.filter((p) => p.status === "draft").length;
  const archived = products.filter((p) => p.status === "archived").length;

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
          <Package className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Product Information Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión del catálogo, atributos, imágenes y auditoría de cambios.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{published}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{drafts}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archivados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-semibold">{archived}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Total de productos en el catálogo</p>
            <p className="text-sm text-muted-foreground">
              {products.length} producto{products.length === 1 ? "" : "s"} registrado{products.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Button asChild>
            <Link to="/pim/products">
              Gestionar catálogo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
