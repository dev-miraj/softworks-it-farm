import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db/schema";

const { Pool } = pg;

function getConnectionUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!url) throw new Error("No database URL configured.");

  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    const url = getConnectionUrl();
    const isNeon = url.includes("neon.tech");
    _pool = new Pool({
      connectionString: url,
      ssl: isNeon ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env["DB_POOL_MAX"] ?? 10),
      min: Number(process.env["DB_POOL_MIN"] ?? 2),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 30_000,
      query_timeout: 30_000,
      allowExitOnIdle: true,
    });

    _pool.on("error", (err) => {
      console.error("[db-pool] Unexpected pool error:", err.message);
    });

    _pool.on("connect", () => {
      if (process.env["NODE_ENV"] === "development") {
        console.log("[db-pool] New client connected");
      }
    });
  }
  return _pool;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_t, prop) {
    const d = getDb();
    const v = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(d) : v;
  },
});

export const pool = new Proxy({} as pg.Pool, {
  get(_t, prop) {
    const p = getPool();
    const v = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(p) : v;
  },
});
