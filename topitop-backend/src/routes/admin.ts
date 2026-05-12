import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

export const adminRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth, requireRole("admin"))
  .get("/me", (c) => c.json({ user: c.get("user") }));
