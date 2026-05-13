import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useStableSession } from "@/lib/use-stable-session";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppFooter } from "@/components/AppFooter";
import { Logo } from "@/components/Logo";
import { ShieldAlert } from "lucide-react";

export function UnauthorizedPage() {
  const { data: session } = useStableSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AnnouncementBar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <Logo size={48} className="mx-auto" />
          <div className="mt-10 flex flex-col items-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              Acceso denegado
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta no tiene permisos para acceder a esta sección.
            </p>
            <div className="mt-6 flex gap-2">
              {session ? (
                <Button variant="outline" onClick={handleSignOut}>
                  Cerrar sesión
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
