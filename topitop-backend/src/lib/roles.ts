export const ROLES = ["admin", "PIM", "PRICING", "ORDER_MANAGEMENT"] as const;
export type Role = (typeof ROLES)[number];
