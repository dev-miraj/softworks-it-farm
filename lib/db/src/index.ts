import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function getConnectionUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||        // Vercel Neon: direct, no PgBouncer ✓
    process.env.POSTGRES_URL_NON_POOLING ||     // Vercel Neon integration alias
    process.env.NEON_DATABASE_URL ||            // Local dev / manual secret
    process.env.POSTGRES_URL ||                 // Vercel Neon integration (pooled)
    process.env.DATABASE_URL;                   // Last resort

  if (!url) throw new Error("No database URL found in environment variables.");

  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

// Detect serverless runtime (evaluated at module load — process.env is runtime on Vercel)
function checkServerless(): boolean {
  return (
    process.env.VERCEL === "1" ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.NETLIFY
  );
}

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzleHttp<typeof schema>> | null = null;

function createPool(): pg.Pool {
  const url = getConnectionUrl();
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 8000,
    allowExitOnIdle: true,
  });
}

export function getPool(): pg.Pool {
  if (!_pool) _pool = createPool();
  return _pool;
}

export function getDb() {
  if (_db) return _db;

  if (checkServerless()) {
    // On Vercel/Lambda: Neon HTTP driver — no TCP pool, no hanging connections
    // Adds 10-second AbortSignal timeout so fetch won't hang forever
    const url = getConnectionUrl();
    const sql = neon(url, {
      fetchOptions: () => ({
        signal: AbortSignal.timeout(10_000),
      }),
    });
    _db = drizzleHttp(sql, { schema });
  } else {
    // Locally: standard pg Pool
    _db = drizzlePg(getPool(), { schema });
  }
  return _db;
}

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
