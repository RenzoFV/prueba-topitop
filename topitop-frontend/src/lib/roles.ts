export const ROLES = ["admin", "PIM", "PRICING", "ORDER_MANAGEMENT"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  PIM: "/pim",
  PRICING: "/pricing",
  ORDER_MANAGEMENT: "/orders",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  PIM: "PIM",
  PRICING: "Pricing",
  ORDER_MANAGEMENT: "Order Management",
};
