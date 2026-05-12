import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect } from "react";
import {
  updateUserSchema,
  type UpdateUserValues,
} from "@/features/admin-users/schemas";
import { useSetRole, useUsers } from "@/features/admin-users/hooks";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setRole = useSetRole();
  const { data, isLoading } = useUsers({ limit: 200 });
  const user = data?.users?.find((u) => u.id === id);

  const form = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { role: "PIM" },
  });

  useEffect(() => {
    if (user?.role) form.reset({ role: user.role as Role });
  }, [user, form]);

  async function onSubmit(values: UpdateUserValues) {
    if (!id) return;
    try {
      await setRole.mutateAsync({ userId: id, role: values.role });
      toast.success("Rol actualizado");
      navigate("/admin/users", { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading) return <FullPageSpinner />;
  if (!user) {
    return (
      <div className="text-muted-foreground">Usuario no encontrado.</div>
    );
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar usuario</CardTitle>
          <CardDescription>
            {user.name} — {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
