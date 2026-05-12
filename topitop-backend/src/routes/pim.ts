import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../lib/db.js";
import { product, productAuditLog } from "../db/business-schema.js";
import { uploadProductImage } from "../lib/storage.js";
import { logProductChange } from "../lib/audit.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const productInputSchema = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default(""),
  images: z.array(z.string().url()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
});

const productUpdateSchema = productInputSchema.partial();

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

function toRecord(row: typeof product.$inferSelect) {
  return {
    ...row,
    cost: Number(row.cost),
    price: Number(row.price),
  };
}

export const pimRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth, requireRole("PIM"))

  .get("/products", zValidator("query", listQuerySchema), async (c) => {
    const { q, status, limit } = c.req.valid("query");
    const filters = [
      q
        ? or(ilike(product.title, `%${q}%`), ilike(product.sku, `%${q}%`))
        : undefined,
      status ? eq(product.status, status) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];
    const rows = await db
      .select()
      .from(product)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(product.createdAt))
      .limit(limit);
    return c.json({ products: rows.map(toRecord) });
  })

  .get("/products/:id", async (c) => {
    const id = c.req.param("id");
    const [row] = await db.select().from(product).where(eq(product.id, id));
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json({ product: toRecord(row) });
  })

  .post("/products", zValidator("json", productInputSchema), async (c) => {
    const data = c.req.valid("json");
    const user = c.get("user");
    const [created] = await db
      .insert(product)
      .values({
        ...data,
        cost: String(data.cost),
        price: String(data.price),
        createdBy: user.id,
      })
      .returning();
    await logProductChange({
      productId: created.id,
      userId: user.id,
      action: "create",
      after: { ...data },
    });
    return c.json({ product: toRecord(created) }, 201);
  })

  .patch(
    "/products/:id",
    zValidator("json", productUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const user = c.get("user");
      const [before] = await db.select().from(product).where(eq(product.id, id));
      if (!before) return c.json({ error: "Not found" }, 404);
      const { cost, price, ...rest } = data;
      const [updated] = await db
        .update(product)
        .set({
          ...rest,
          ...(cost !== undefined && { cost: String(cost) }),
          ...(price !== undefined && { price: String(price) }),
        })
        .where(eq(product.id, id))
        .returning();
      await logProductChange({
        productId: id,
        userId: user.id,
        action: "update",
        before: toRecord(before),
        after: toRecord(updated),
      });
      return c.json({ product: toRecord(updated) });
    },
  )

  .delete("/products/:id", async (c) => {
    const id = c.req.param("id");
    const user = c.get("user");
    const [before] = await db.select().from(product).where(eq(product.id, id));
    if (!before) return c.json({ error: "Not found" }, 404);
    await db
      .update(product)
      .set({ status: "archived" })
      .where(eq(product.id, id));
    await logProductChange({
      productId: id,
      userId: user.id,
      action: "delete",
      before: toRecord(before),
      after: { ...toRecord(before), status: "archived" },
      note: "Soft-delete: archivado",
    });
    return c.json({ ok: true });
  })

  .get("/products/:id/audit", async (c) => {
    const id = c.req.param("id");
    const rows = await db
      .select()
      .from(productAuditLog)
      .where(eq(productAuditLog.productId, id))
      .orderBy(desc(productAuditLog.createdAt))
      .limit(200);
    return c.json({ entries: rows });
  })

  .post("/upload", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const productId = formData.get("productId");
    if (!(file instanceof File))
      return c.json({ error: "file requerido" }, 400);
    if (typeof productId !== "string")
      return c.json({ error: "productId requerido" }, 400);
    try {
      const url = await uploadProductImage(file, productId);
      return c.json({ url });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 500);
    }
  });
