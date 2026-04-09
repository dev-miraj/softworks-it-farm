import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function getConnectionUrl(): string {
  // Priority — UNPOOLED first:
  //   Vercel Neon integration automatically sets DATABASE_URL_UNPOOLED (direct, no PgBouncer).
  //   PgBouncer (pooled) hangs on Vercel serverless even with channel_binding stripped,
  //   so we must use the direct/unpooled connection in production.
  // Locally:
  //   DATABASE_URL_UNPOOLED is not set → falls through to NEON_DATABASE_URL which works fine.
  const url =
    process.env.DATABASE_URL_UNPOOLED ||        // Vercel Neon: direct, no PgBouncer ✓
    process.env.POSTGRES_URL_NON_POOLING ||     // Alternate unpooled alias
    process.env.NEON_DATABASE_URL ||            // Local dev / manual secret
    process.env.DATABASE_URL;                   // Last resort

  if (!url) throw new Error("No database URL found in environment variables.");

  // Strip channel_binding — not supported by PgBouncer; safe to remove everywhere.
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

// Detect serverless (Vercel / AWS Lambda / etc.)
const isServerless =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NODE_ENV === "production" && !process.env.LOCAL_DEV;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzleHttp<typeof schema>> | null = null;

function createPool(): pg.Pool {
  const url = getConnectionUrl();
  const isNeon = url.includes("neon.tech");
  return new Pool({
    connectionString: url,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
}

export function getPool(): pg.Pool {
  if (!_pool) _pool = createPool();
  return _pool;
}

export function getDb() {
  if (_db) return _db;

  if (isServerless) {
    // On Vercel: use Neon's HTTP driver — no TCP pool, instant cold start
    const url = getConnectionUrl();
    const sql = neon(url);
    _db = drizzleHttp(sql, { schema });
  } else {
    // Locally: use standard pg Pool
    _db = drizzlePg(getPool(), { schema });
  }
  return _db;
}

// Proxy with correct `this` binding so pool/db methods work correctly
export const pool = new Proxy({} as pg.Pool, {
  get(_t, prop) {
    const p = getPool();
    const v = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(p) : v;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzlePg<typeof schema>>, {
  get(_t, prop) {
    const d = getDb();
    const v = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(d) : v;
  },
});

export * from "./schema";
