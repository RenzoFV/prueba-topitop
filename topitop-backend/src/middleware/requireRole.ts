import { createMiddleware } from "hono/factory";
import type { Role } from "../lib/roles.js";
import type { AuthVariables } from "./auth.js";

export const requireRole = (...allowed: Role[]) =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const user = c.get("user");
    const role = user.role as Role | null | undefined;
    if (role !== "admin" && (!role || !allowed.includes(role))) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  });
