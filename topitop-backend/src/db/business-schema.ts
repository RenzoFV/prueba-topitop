import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./schema.js";

/* ---------- PIM ---------- */

export const product = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sku: text("sku").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default(""),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    stock: integer("stock").notNull().default(0),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("product_status_idx").on(t.status),
    index("product_category_idx").on(t.category),
  ],
);

export const productAuditLog = pgTable(
  "product_audit_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action", {
      enum: ["create", "update", "delete", "restore"],
    }).notNull(),
    changes: jsonb("changes")
      .$type<Record<string, { from: unknown; to: unknown }>>()
      .notNull()
      .default({}),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("product_audit_product_idx").on(t.productId),
    index("product_audit_createdAt_idx").on(t.createdAt),
  ],
);

/* ---------- PRICING ---------- */

export const promotion = pgTable(
  "promotion",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id").references(() => product.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    discountType: text("discount_type", { enum: ["percent", "fixed"] }).notNull(),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("promotion_product_idx").on(t.productId)],
);

export const stockMovement = pgTable(
  "stock_movement",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    deltaQty: integer("delta_qty").notNull(),
    reason: text("reason", {
      enum: ["restock", "adjustment", "sale", "return"],
    }).notNull(),
    note: text("note"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("stock_movement_product_idx").on(t.productId)],
);

/* ---------- ORDERS ---------- */

export const order = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderNumber: text("order_number").notNull().unique(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull().default(""),
    shippingAddress: text("shipping_address").notNull(),
    shippingCity: text("shipping_city").notNull(),
    status: text("status", {
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    })
      .notNull()
      .default("pending"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("order_status_idx").on(t.status)],
);

export const orderItem = pgTable(
  "order_item",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => product.id, {
      onDelete: "set null",
    }),
    productSnapshot: jsonb("product_snapshot")
      .$type<{ sku: string; title: string; price: string }>()
      .notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => [index("order_item_order_idx").on(t.orderId)],
);
