import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { auth } from "./lib/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { pimRoutes } from "./routes/pim.js";
import { pricingRoutes } from "./routes/pricing.js";
import { ordersRoutes } from "./routes/orders.js";
import { seedRoutes } from "./routes/seed.js";

export const app = new Hono()
  .use(
    "/api/*",
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }),
  )
  .get("/", (c) => c.json({ status: "ok", service: "topitop-backend" }))
  .on(["POST", "GET"], "/api/auth/*", async (c) => {
    try {
      return await auth.handler(c.req.raw);
    } catch (err) {
      const cause = (err as { cause?: { message?: string; code?: string; detail?: string } }).cause;
      console.error("[AUTH HANDLER ERROR]", (err as Error).message);
      console.error("[AUTH HANDLER CAUSE MSG]", cause?.message);
      console.error("[AUTH HANDLER CAUSE CODE]", cause?.code);
      console.error("[AUTH HANDLER CAUSE DETAIL]", cause?.detail);
      console.error("[AUTH HANDLER STACK]", (err as Error).stack);
      return c.json(
        {
          error: (err as Error).message,
          cause: cause?.message ?? null,
          code: cause?.code ?? null,
          detail: cause?.detail ?? null,
        },
        500,
      );
    }
  })
  .route("/api/admin", adminRoutes)
  .route("/api/pim", pimRoutes)
  .route("/api/pricing", pricingRoutes)
  .route("/api/orders", ordersRoutes)
  .route("/api/seed", seedRoutes);

app.onError((err, c) => {
  const cause = (err as { cause?: { message?: string; code?: string } }).cause;
  console.error("[ERROR MESSAGE]", err.message);
  if (cause) {
    console.error("[ERROR CAUSE]", JSON.stringify(cause));
  }
  console.error("[ERROR STACK]", err.stack);
  return c.json(
    {
      error: err.message,
      cause: cause?.message ?? null,
      code: cause?.code ?? null,
    },
    500,
  );
});

export type AppType = typeof app;

export default app;
