import { createMiddleware } from "hono/factory";
import { auth, type Session } from "../lib/auth.js";

export type AuthVariables = {
  user: Session["user"];
  session: Session["session"];
};

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const data = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!data) return c.json({ error: "Unauthorized" }, 401);
    c.set("user", data.user);
    c.set("session", data.session);
    await next();
  }
);
