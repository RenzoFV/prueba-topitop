import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("product-images"),
  PRICING_MIN_MARGIN_PCT: z.coerce.number().min(0).max(500).default(20),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const tree = z.treeifyError(parsed.error);
  console.error("Invalid environment variables:", JSON.stringify(tree, null, 2));
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(tree)}`,
  );
}

export const env = parsed.data;
