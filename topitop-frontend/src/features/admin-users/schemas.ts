import { z } from "zod";
import { ROLES } from "@/lib/roles";

export const createUserSchema = z.object({
  email: z.email("Correo inválido"),
  name: z.string().min(1, "Requerido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(ROLES),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  role: z.enum(ROLES),
});

export type UpdateUserValues = z.infer<typeof updateUserSchema>;
