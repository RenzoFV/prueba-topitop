import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useUsers, useBanUser, useUnbanUser, useRemoveUser } from "@/features/admin-users/hooks";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Users } from "lucide-react";

export function UsersListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useUsers({ searchValue: search });
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const removeUser = useRemoveUser();

  async function handleBan(userId: string) {
    try {
      await banUser.mutateAsync({ userId });
      toast.success("Usuario baneado");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleUnban(userId: string) {
    try {
      await unbanUser.mutateAsync({ userId });
      toast.success("Usuario desbaneado");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    try {
      await removeUser.mutateAsync({ userId });
      toast.success("Usuario eliminado");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de cuentas, roles y permisos.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/users/new">
            <Plus className="size-4" />
            Nuevo usuario
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <Input
            placeholder="Buscar por correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-15"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                {[0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="text-destructive">
                  {(error as Error).message}
                </TableCell>
              </TableRow>
            )}
            {data?.users?.map((u) => {
              const role = (u.role as Role | null | undefined) ?? null;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {role ? ROLE_LABEL[role] ?? role : "—"}
                  </TableCell>
                  <TableCell>
                    {u.banned ? (
                      <Badge variant="destructive">Baneado</Badge>
                    ) : (
                      <Badge variant="secondary">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/users/${u.id}`}>Editar rol</Link>
                        </DropdownMenuItem>
                        {u.banned ? (
                          <DropdownMenuItem onClick={() => handleUnban(u.id)}>
                            Desbanear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleBan(u.id)}>
                            Banear
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleRemove(u.id)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {data && data.users?.length === 0 && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

