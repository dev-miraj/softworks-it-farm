import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getConnectionUrl(): string {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!url) throw new Error("No database URL found in environment variables.");

  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

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

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) _db = drizzle(getPool(), { schema });
  return _db;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_t, prop) {
    const p = getPool();
    const v = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(p) : v;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_t, prop) {
    const d = getDb();
    const v = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof v === "function" ? (v as Function).bind(d) : v;
  },
});

export * from "./schema";
