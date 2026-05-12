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
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .route("/api/admin", adminRoutes)
  .route("/api/pim", pimRoutes)
  .route("/api/pricing", pricingRoutes)
  .route("/api/orders", ordersRoutes)
  .route("/api/seed", seedRoutes);

export type AppType = typeof app;

export default app;
