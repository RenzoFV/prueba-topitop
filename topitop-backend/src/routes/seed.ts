import { Hono } from "hono";
import { db } from "../lib/db.js";
import {
  product,
  productAuditLog,
  promotion,
  stockMovement,
  order,
  orderItem,
} from "../db/business-schema.js";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const SAMPLE_PRODUCTS = [
  {
    sku: "POLO-M-001",
    title: "Polo básico hombre algodón pima",
    description:
      "Polo de algodón pima 100%, cuello redondo, manga corta. Disponible en blanco, negro y marino.",
    category: "Hombre",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    ],
    status: "published" as const,
    cost: "25.00",
    price: "59.90",
    stock: 120,
  },
  {
    sku: "POLO-W-001",
    title: "Polo entallado mujer",
    description: "Polo entallado para mujer en algodón premium.",
    category: "Mujer",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
    ],
    status: "published" as const,
    cost: "22.00",
    price: "54.90",
    stock: 85,
  },
  {
    sku: "JEAN-M-101",
    title: "Jean slim hombre azul oscuro",
    description: "Jean de corte slim, denim premium, talla 28 a 38.",
    category: "Denim",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
    ],
    status: "published" as const,
    cost: "55.00",
    price: "129.90",
    stock: 60,
  },
  {
    sku: "JEAN-W-101",
    title: "Jean skinny mujer",
    description: "Jean skinny tiro alto, denim stretch.",
    category: "Denim",
    images: [
      "https://images.unsplash.com/photo-1602573991155-21f0143bb45c?w=800",
    ],
    status: "published" as const,
    cost: "58.00",
    price: "139.90",
    stock: 45,
  },
  {
    sku: "CASACA-U-201",
    title: "Casaca cortavientos unisex",
    description: "Cortavientos liviano impermeable, ideal para entretiempo.",
    category: "Casacas",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
    ],
    status: "published" as const,
    cost: "85.00",
    price: "199.90",
    stock: 30,
  },
  {
    sku: "CHOMPA-W-301",
    title: "Chompa cuello alto mujer",
    description: "Chompa de punto, cuello alto, en colores neutros.",
    category: "Mujer",
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
    ],
    status: "published" as const,
    cost: "48.00",
    price: "119.90",
    stock: 55,
  },
  {
    sku: "POLO-K-401",
    title: "Polo infantil estampado",
    description: "Polo para niño con estampado divertido.",
    category: "Infantil",
    images: [
      "https://images.unsplash.com/photo-1543854704-783b5b3a1fbf?w=800",
    ],
    status: "draft" as const,
    cost: "18.00",
    price: "39.90",
    stock: 0,
  },
  {
    sku: "BASIC-U-501",
    title: "T-shirt blanca básica",
    description: "T-shirt blanca cuello redondo, ideal para diario.",
    category: "Básicos",
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
    ],
    status: "published" as const,
    cost: "12.00",
    price: "29.90",
    stock: 200,
  },
];

export const seedRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth, requireRole("admin"))

  .post("/run", async (c) => {
    const userId = c.get("user").id;
    const now = new Date();

    // Limpia datos previos
    await db.delete(orderItem);
    await db.delete(order);
    await db.delete(stockMovement);
    await db.delete(promotion);
    await db.delete(productAuditLog);
    await db.delete(product);

    const inserted = await db
      .insert(product)
      .values(SAMPLE_PRODUCTS.map((p) => ({ ...p, createdBy: userId })))
      .returning();

    // Audit log para cada producto creado
    await db.insert(productAuditLog).values(
      inserted.map((p) => ({
        productId: p.id,
        userId,
        action: "create" as const,
        changes: {
          sku: { from: null, to: p.sku },
          title: { from: null, to: p.title },
          price: { from: null, to: Number(p.price) },
        },
        note: "Producto inicial cargado vía seed",
      })),
    );

    // Una promo activa de ejemplo (15% en jeans)
    const jean = inserted.find((p) => p.sku === "JEAN-M-101");
    if (jean) {
      await db.insert(promotion).values({
        productId: jean.id,
        name: "Descuento de temporada en jeans",
        discountType: "percent",
        discountValue: "15",
        startsAt: now,
        endsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        createdBy: userId,
      });
    }

    // 3 órdenes de ejemplo en estados distintos
    const polo = inserted.find((p) => p.sku === "POLO-M-001")!;
    const casaca = inserted.find((p) => p.sku === "CASACA-U-201")!;
    const tshirt = inserted.find((p) => p.sku === "BASIC-U-501")!;

    const orderSeeds = [
      {
        orderNumber: "ORD-SEED-001",
        customerName: "María Rojas",
        customerEmail: "maria.rojas@example.com",
        customerPhone: "+51 999 111 222",
        shippingAddress: "Av. La Marina 123, San Miguel",
        shippingCity: "Lima",
        status: "pending" as const,
        total: (Number(polo.price) * 2).toFixed(2),
        items: [{ product: polo, quantity: 2 }],
      },
      {
        orderNumber: "ORD-SEED-002",
        customerName: "Carlos Mendoza",
        customerEmail: "carlos.mendoza@example.com",
        customerPhone: "+51 988 444 555",
        shippingAddress: "Calle Los Olivos 456, Surco",
        shippingCity: "Lima",
        status: "shipped" as const,
        carrier: "Olva",
        trackingNumber: "OLV-998877",
        trackingUrl: "https://www.olvacourier.com/site/tracking/OLV-998877",
        total: Number(casaca.price).toFixed(2),
        items: [{ product: casaca, quantity: 1 }],
      },
      {
        orderNumber: "ORD-SEED-003",
        customerName: "Lucía Pérez",
        customerEmail: "lucia.perez@example.com",
        customerPhone: "+51 977 333 666",
        shippingAddress: "Jr. Cusco 789, Cercado",
        shippingCity: "Arequipa",
        status: "delivered" as const,
        carrier: "Shalom",
        trackingNumber: "SHA-554433",
        trackingUrl: "https://www.shalom.com.pe/tracking/SHA-554433",
        total: (Number(tshirt.price) * 3).toFixed(2),
        items: [{ product: tshirt, quantity: 3 }],
      },
    ];

    for (const seed of orderSeeds) {
      const { items, ...header } = seed;
      const [created] = await db.insert(order).values(header).returning();
      for (const line of items) {
        await db.insert(orderItem).values({
          orderId: created.id,
          productId: line.product.id,
          productSnapshot: {
            sku: line.product.sku,
            title: line.product.title,
            price: String(line.product.price),
          },
          quantity: line.quantity,
          unitPrice: line.product.price,
        });
      }
    }

    return c.json({
      ok: true,
      products: inserted.length,
      orders: orderSeeds.length,
      promotions: jean ? 1 : 0,
    });
  });
