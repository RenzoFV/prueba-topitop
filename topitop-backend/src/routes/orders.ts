import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import {
  order,
  orderItem,
  product,
  stockMovement,
} from "../db/business-schema.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.email(),
  customerPhone: z.string().default(""),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  items: z.array(itemSchema).min(1),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

const trackingSchema = z.object({
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
  trackingUrl: z.string().url().optional(),
});

const listQuerySchema = z.object({
  status: z
    .enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

function genOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORD-${ts}-${rnd}`;
}

function buildTrackingUrl(carrier: string, trackingNumber: string) {
  const map: Record<string, string> = {
    olva: `https://www.olvacourier.com/site/tracking/${trackingNumber}`,
    serpost: `https://www.serpost.com.pe/tracking/${trackingNumber}`,
    shalom: `https://www.shalom.com.pe/tracking/${trackingNumber}`,
  };
  return map[carrier.toLowerCase()] ?? null;
}

export const ordersRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth, requireRole("ORDER_MANAGEMENT"))

  .get("/orders", zValidator("query", listQuerySchema), async (c) => {
    const { status, limit } = c.req.valid("query");
    const filters = [status ? eq(order.status, status) : undefined].filter(
      Boolean,
    ) as ReturnType<typeof eq>[];
    const rows = await db
      .select()
      .from(order)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(order.createdAt))
      .limit(limit);
    return c.json({
      orders: rows.map((r) => ({ ...r, total: Number(r.total) })),
    });
  })

  .get("/orders/:id", async (c) => {
    const id = c.req.param("id");
    const [row] = await db.select().from(order).where(eq(order.id, id));
    if (!row) return c.json({ error: "Pedido no encontrado" }, 404);
    const items = await db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, id));
    return c.json({
      order: { ...row, total: Number(row.total) },
      items: items.map((it) => ({ ...it, unitPrice: Number(it.unitPrice) })),
    });
  })

  .post("/orders", zValidator("json", createOrderSchema), async (c) => {
    const data = c.req.valid("json");

    const productIds = data.items.map((it) => it.productId);
    const products = await db
      .select()
      .from(product)
      .where(sql`${product.id} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`);
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const linePayloads = data.items.map((line) => {
      const p = byId.get(line.productId);
      if (!p) throw new Error(`Producto ${line.productId} no existe`);
      if (p.stock < line.quantity)
        throw new Error(
          `Stock insuficiente para ${p.title} (disponible: ${p.stock}, solicitado: ${line.quantity})`,
        );
      const unitPrice = Number(p.price);
      total += unitPrice * line.quantity;
      return {
        product: p,
        line,
        unitPrice,
      };
    });

    const orderNumber = genOrderNumber();

    const created = await db.transaction(async (tx) => {
      const [orderRow] = await tx
        .insert(order)
        .values({
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          total: total.toFixed(2),
          notes: data.notes ?? null,
        })
        .returning();

      for (const lp of linePayloads) {
        await tx.insert(orderItem).values({
          orderId: orderRow.id,
          productId: lp.product.id,
          productSnapshot: {
            sku: lp.product.sku,
            title: lp.product.title,
            price: String(lp.product.price),
          },
          quantity: lp.line.quantity,
          unitPrice: lp.unitPrice.toFixed(2),
        });
        await tx
          .update(product)
          .set({ stock: sql`${product.stock} - ${lp.line.quantity}` })
          .where(eq(product.id, lp.product.id));
        await tx.insert(stockMovement).values({
          productId: lp.product.id,
          deltaQty: -lp.line.quantity,
          reason: "sale",
          note: `Pedido ${orderNumber}`,
          createdBy: c.get("user").id,
        });
      }
      return orderRow;
    });

    return c.json(
      { order: { ...created, total: Number(created.total) } },
      201,
    );
  })

  .patch(
    "/orders/:id/status",
    zValidator("json", statusSchema),
    async (c) => {
      const id = c.req.param("id");
      const { status } = c.req.valid("json");
      const [updated] = await db
        .update(order)
        .set({ status })
        .where(eq(order.id, id))
        .returning();
      if (!updated) return c.json({ error: "Pedido no encontrado" }, 404);
      return c.json({ order: { ...updated, total: Number(updated.total) } });
    },
  )

  .patch(
    "/orders/:id/tracking",
    zValidator("json", trackingSchema),
    async (c) => {
      const id = c.req.param("id");
      const { carrier, trackingNumber, trackingUrl } = c.req.valid("json");
      const finalUrl =
        trackingUrl ?? buildTrackingUrl(carrier, trackingNumber);
      const [updated] = await db
        .update(order)
        .set({
          carrier,
          trackingNumber,
          trackingUrl: finalUrl,
          status: "shipped",
        })
        .where(eq(order.id, id))
        .returning();
      if (!updated) return c.json({ error: "Pedido no encontrado" }, 404);
      return c.json({ order: { ...updated, total: Number(updated.total) } });
    },
  );
