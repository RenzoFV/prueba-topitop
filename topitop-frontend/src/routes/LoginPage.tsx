import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useStableSession } from "@/lib/use-stable-session";
import { ROLE_HOME, type Role } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { AppFooter } from "@/components/AppFooter";
import { Logo } from "@/components/Logo";

const schema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

function redirectFor(role: Role | null | undefined): string {
  if (role && role in ROLE_HOME) return ROLE_HOME[role];
  return "/unauthorized";
}

export function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isInitialLoading } = useStableSession();

  useEffect(() => {
    if (session) {
      navigate(redirectFor(session.user.role as Role | null | undefined), {
        replace: true,
      });
    }
  }, [session, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? "No se pudo iniciar sesión");
      return;
    }
    const role = (data?.user.role ?? null) as Role | null;
    navigate(redirectFor(role), { replace: true });
  }

  if (isInitialLoading) return <FullPageSpinner />;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AnnouncementBar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex flex-col items-center text-center">
            <Logo size={64} />
            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Portal interno
            </p>
          </div>

          <div className="rounded-xl border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Iniciar sesión
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa con tu cuenta corporativa para acceder al panel.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="tu@topitop.pe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="mt-2 h-11 w-full text-sm font-semibold tracking-wide uppercase"
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Ingresar
                </Button>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
