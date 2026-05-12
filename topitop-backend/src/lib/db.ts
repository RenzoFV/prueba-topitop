import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env.js";
import * as authSchema from "../db/schema.js";
import * as businessSchema from "../db/business-schema.js";

const isServerless = !!process.env.VERCEL;

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 10_000 : 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: isServerless ? { rejectUnauthorized: false } : undefined,
});

export const schema = { ...authSchema, ...businessSchema };
export const db = drizzle(pool, { schema });
