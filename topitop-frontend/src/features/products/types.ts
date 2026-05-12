export type ProductStatus = "draft" | "published" | "archived";

export type Product = {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  status: ProductStatus;
  cost: number;
  price: number;
  stock: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  productId: string;
  userId: string | null;
  action: "create" | "update" | "delete" | "restore";
  changes: Record<string, { from: unknown; to: unknown }>;
  note: string | null;
  createdAt: string;
};

export type Promotion = {
  id: string;
  productId: string | null;
  name: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  deltaQty: number;
  reason: "restock" | "adjustment" | "sale" | "return";
  note: string | null;
  createdAt: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  status: OrderStatus;
  total: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  productSnapshot: { sku: string; title: string; price: string };
  quantity: number;
  unitPrice: number;
};
