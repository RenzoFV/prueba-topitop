import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import {
  product,
  promotion,
  stockMovement,
} from "../db/business-schema.js";
import { validatePrice, marginPercent } from "../lib/pricing.js";
import { env } from "../env.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const priceUpdateSchema = z.object({
  price: z.coerce.number().min(0),
});

const promotionSchema = z.object({
  productId: z.string().min(1).nullable(),
  name: z.string().min(1),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number().min(0),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

const restockSchema = z.object({
  deltaQty: z.coerce.number().int().refine((n) => n !== 0, "no puede ser 0"),
  reason: z.enum(["restock", "adjustment", "return"]).default("restock"),
  note: z.string().optional(),
});

export const pricingRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth, requireRole("PRICING"))

  .get("/config", (c) =>
    c.json({ minMarginPct: env.PRICING_MIN_MARGIN_PCT }),
  )

  .get("/products", async (c) => {
    const rows = await db
      .select()
      .from(product)
      .orderBy(desc(product.createdAt))
      .limit(200);
    return c.json({
      products: rows.map((r) => {
        const cost = Number(r.cost);
        const price = Number(r.price);
        return {
          ...r,
          cost,
          price,
          margin: marginPercent(cost, price),
        };
      }),
    });
  })

  .patch(
    "/products/:id/price",
    zValidator("json", priceUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const { price } = c.req.valid("json");
      const [row] = await db.select().from(product).where(eq(product.id, id));
      if (!row) return c.json({ error: "Producto no encontrado" }, 404);
      const cost = Number(row.cost);
      const validation = validatePrice(cost, price);
      if (!validation.ok) {
        return c.json(
          {
            error: `Margen ${validation.margin}% es menor al mínimo ${validation.minMargin}%. Precio mínimo permitido: S/ ${validation.minPrice}.`,
            ...validation,
          },
          400,
        );
      }
      const [updated] = await db
        .update(product)
        .set({ price: String(price) })
        .where(eq(product.id, id))
        .returning();
      return c.json({
        product: {
          ...updated,
          cost: Number(updated.cost),
          price: Number(updated.price),
          margin: validation.margin,
        },
      });
    },
  )

  .get("/promotions", async (c) => {
    const rows = await db
      .select()
      .from(promotion)
      .orderBy(desc(promotion.createdAt))
      .limit(200);
    return c.json({
      promotions: rows.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
      })),
    });
  })

  .post("/promotions", zValidator("json", promotionSchema), async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");
    if (data.endsAt <= data.startsAt) {
      return c.json({ error: "endsAt debe ser posterior a startsAt" }, 400);
    }
    if (data.productId) {
      const [target] = await db
        .select()
        .from(product)
        .where(eq(product.id, data.productId));
      if (!target) return c.json({ error: "Producto no encontrado" }, 404);
      const cost = Number(target.cost);
      const basePrice = Number(target.price);
      const discounted =
        data.discountType === "percent"
          ? basePrice * (1 - data.discountValue / 100)
          : basePrice - data.discountValue;
      const v = validatePrice(cost, discounted);
      if (!v.ok) {
        return c.json(
          {
            error: `La promoción dejaría el precio bajo el margen mínimo (${v.minMargin}%). Mínimo permitido: S/ ${v.minPrice}.`,
            ...v,
          },
          400,
        );
      }
    }
    const [created] = await db
      .insert(promotion)
      .values({
        ...data,
        discountValue: String(data.discountValue),
        createdBy: user.id,
      })
      .returning();
    return c.json({
      promotion: {
        ...created,
        discountValue: Number(created.discountValue),
      },
    }, 201);
  })

  .patch(
    "/promotions/:id/toggle",
    zValidator("json", z.object({ active: z.boolean() })),
    async (c) => {
      const id = c.req.param("id");
      const { active } = c.req.valid("json");
      const [updated] = await db
        .update(promotion)
        .set({ active })
        .where(eq(promotion.id, id))
        .returning();
      if (!updated) return c.json({ error: "Promoción no encontrada" }, 404);
      return c.json({
        promotion: { ...updated, discountValue: Number(updated.discountValue) },
      });
    },
  )

  .post(
    "/products/:id/restock",
    zValidator("json", restockSchema),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const user = c.get("user");
      const [row] = await db.select().from(product).where(eq(product.id, id));
      if (!row) return c.json({ error: "Producto no encontrado" }, 404);
      const newStock = row.stock + data.deltaQty;
      if (newStock < 0)
        return c.json({ error: "El stock no puede ser negativo" }, 400);
      await db.transaction(async (tx) => {
        await tx
          .update(product)
          .set({ stock: sql`${product.stock} + ${data.deltaQty}` })
          .where(eq(product.id, id));
        await tx.insert(stockMovement).values({
          productId: id,
          deltaQty: data.deltaQty,
          reason: data.reason,
          note: data.note ?? null,
          createdBy: user.id,
        });
      });
      return c.json({ stock: newStock });
    },
  )

  .get("/products/:id/stock-movements", async (c) => {
    const id = c.req.param("id");
    const rows = await db
      .select()
      .from(stockMovement)
      .where(eq(stockMovement.productId, id))
      .orderBy(desc(stockMovement.createdAt))
      .limit(100);
    return c.json({ movements: rows });
  })

  .get("/stock-movements", async (c) => {
    const rows = await db
      .select()
      .from(stockMovement)
      .orderBy(desc(stockMovement.createdAt))
      .limit(100);
    return c.json({ movements: rows });
  });
