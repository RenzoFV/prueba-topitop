import { db } from "./db.js";
import { productAuditLog } from "../db/business-schema.js";

type AuditAction = "create" | "update" | "delete" | "restore";

export async function logProductChange(input: {
  productId: string;
  userId: string | null;
  action: AuditAction;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
}) {
  const { before, after } = input;
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before && after) {
    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { from: before[key], to: after[key] };
      }
    }
  } else if (after) {
    for (const [key, value] of Object.entries(after)) {
      changes[key] = { from: null, to: value };
    }
  }
  await db.insert(productAuditLog).values({
    productId: input.productId,
    userId: input.userId,
    action: input.action,
    changes,
    note: input.note ?? null,
  });
}
