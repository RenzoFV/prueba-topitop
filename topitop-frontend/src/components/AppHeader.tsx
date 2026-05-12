import { Link, NavLink, useNavigate } from "react-router";
import { authClient, useSession } from "@/lib/auth-client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/roles";
import { LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; to: string };

export function AppHeader({
  section,
  nav,
}: {
  section: string;
  nav?: NavItem[];
}) {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const user = session?.user;
  const role = user?.role as Role | undefined;
  const home = role && role in ROLE_HOME ? ROLE_HOME[role] : "/";
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? "U";

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <Link to={home} aria-label="Inicio" className="flex items-center">
            <Logo size={32} />
          </Link>
          <div className="hidden h-6 w-px bg-border md:block" />
          <span className="hidden text-sm font-medium uppercase tracking-wider text-muted-foreground md:inline">
            {section}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {role && (
            <Badge
              variant="outline"
              className="hidden border-foreground/15 text-xs font-medium sm:inline-flex"
            >
              {ROLE_LABEL[role]}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Menú de usuario"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <UserIcon className="size-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {nav && nav.length > 0 && (
        <nav className="border-t bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "relative flex h-11 items-center px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
